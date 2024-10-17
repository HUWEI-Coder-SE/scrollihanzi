import base64
from flask import Flask, request, jsonify
from datetime import datetime
import image_manager
import requests

app = Flask(__name__)

app_secrets = {
    'wx636d1daf20b6a276': 'b44f134d6e7a7fd0a071badf50d33567',
}


# 绑定openID与图片的接口
@app.route('/bind_openid_to_picture', methods=['POST'])
def bind_openid_to_picture():
    data = request.get_json()
    open_id = data.get('openID')
    picture_id = data.get('pictureID')

    if not open_id or not picture_id:
        return jsonify({'status': 'error', 'message': 'openID:{0}或pictureID:{1}缺失'.format(open_id, picture_id)}), 400

    user_id = image_manager.get_user_id_by_openid(open_id)

    if user_id is None:
        # 生成一个随机的10位数字作为user_id
        user_id = image_manager.generate_random_user_id()
        # 创建新的用户记录
        success = image_manager.create_user_with_id(user_id, open_id)
        if not success:
            return jsonify({'status': 'error', 'message': '创建用户失败'}), 500

    # 使用更新函数
    success = image_manager.update_userid_by_pictureid(user_id, picture_id)

    if success:
        return jsonify({'status': 'success', 'message': '绑定成功并更新图片信息'})
    else:
        return jsonify({'status': 'error', 'message': '更新图片信息失败'}), 500


@app.route('/upload_prompt_character', methods=['POST'])
def upload_prompt_character():
    data = request.get_json()
    prompt = data.get('prompt', '')
    character = data.get('character', '')
    components = data.get('components', '')

    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    assignment_id = image_manager.insert_prompt_character(prompt, character, components, current_time)

    if assignment_id:
        return jsonify({'status': 'success', 'assignmentID': assignment_id})
    else:
        return jsonify({'status': 'error', 'message': '插入信息失败'}), 500


# 上传接口：处理图片上传，增加对重复上传的校验
@app.route('/upload_image', methods=['POST'])
def upload_image():
    data = request.get_json()
    assignment_id = data.get('assignmentID')
    image_base64 = data.get('imageBase64')

    if not assignment_id or not image_base64:
        return jsonify({'status': 'error', 'message': '缺少assignmentID或图片数据'}), 400

    # 检查该 assignmentID 是否已经绑定了图片
    existing_record = image_manager.get_record_by_assignment_id(assignment_id)
    if existing_record and existing_record.get('pictureID'):
        return jsonify({'status': 'error', 'message': '该 assignmentID 已经绑定了图片，无法覆盖'}), 400

    picture_id, oss_image_path = image_manager.upload_image_to_oss(assignment_id, image_base64)

    if picture_id and oss_image_path:
        success = image_manager.update_image_url(assignment_id, oss_image_path, picture_id)
        if success:
            return jsonify({'status': 'success', 'pictureID': picture_id, 'ossImagePath': oss_image_path})
        else:
            return jsonify({'status': 'error', 'message': '更新数据库失败'}), 500
    else:
        return jsonify({'status': 'error', 'message': '图片上传失败'}), 500


# 微信登录接口
@app.route('/wechat_login', methods=['POST'])
def wechat_login():
    data = request.get_json()

    app_id = data.get('appID')  # 从小程序端获取的appID
    code = data.get('code')  # 从小程序端获取的用户临时ID (code)

    if not app_id or not code:
        return jsonify({'status': 'error', 'message': '缺少appID或code参数'}), 400

    # 根据appID查找对应的appSecret
    app_secret = app_secrets.get(app_id)
    if not app_secret:
        return jsonify({'status': 'error', 'message': '无效的appID'}), 400

    # 构建微信API URL
    url = f'https://api.weixin.qq.com/sns/jscode2session?appid={app_id}&secret={app_secret}&js_code={code}&grant_type=authorization_code'

    try:
        # 发送请求给微信服务器
        response = requests.get(url)
        data = response.json()

        if 'errcode' in data:
            return jsonify({'status': 'error', 'message': data['errmsg']}), 400

        open_id = data.get('openid')  # 获取openid
        # session_key = data.get('session_key')  # 获取session_key (如果需要使用)

        # 返回openid给小程序
        return jsonify({'status': 'success', 'openId': open_id})

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'微信登录请求失败: {str(e)}'}), 500


# 获取用户生成的所有图片及信息，返回包含临时签名URL的imageURL
@app.route('/get_user_images', methods=['GET'])
def get_user_images():
    open_id = request.args.get('openID')

    if not open_id:
        return jsonify({'status': 'error', 'message': 'openID缺失'}), 400

    user_id = image_manager.get_user_id_by_openid(open_id)

    images = image_manager.get_user_images(user_id)

    if images:
        return jsonify({'status': 'success', 'images': images})
    else:
        return jsonify({'status': 'error', 'message': '未找到用户图片信息'}), 404


# 获取指定 assignmentID 的记录，返回包含临时签名URL的imageURL
@app.route('/get_data', methods=['GET'])
def get_data():
    assignment_id = request.args.get('assignmentID')

    if not assignment_id:
        return jsonify({'status': 'error', 'message': '缺少assignmentID'}), 400

    record = image_manager.get_record_by_assignment_id(assignment_id)

    if record:
        return jsonify({'status': 'success', 'data': record})
    else:
        return jsonify({'status': 'error', 'message': '未找到对应的记录'}), 404


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=6000, debug=True)

