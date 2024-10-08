import base64
from flask import Flask, request, jsonify
from datetime import datetime
import image_manager

app = Flask(__name__)

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
        return jsonify({'status': 'error', 'message': '未找到对应的userID'}), 400

    # 使用新的更新函数
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




# 上传接口2：处理图片上传
@app.route('/upload_image', methods=['POST'])
def upload_image():
    data = request.get_json()
    assignment_id = data.get('assignmentID')
    image_base64 = data.get('imageBase64')

    if not assignment_id or not image_base64:
        return jsonify({'status': 'error', 'message': '缺少assignmentID或图片数据'}), 400

    local_image_path = "temp_image.png"
    with open(local_image_path, "wb") as fh:
        fh.write(base64.b64decode(image_base64))

    picture_id, img_url = image_manager.upload_image_to_oss(local_image_path)

    if picture_id and img_url:
        success = image_manager.update_image_url(assignment_id, img_url, picture_id)
        if success:
            return jsonify({'status': 'success', 'pictureID': picture_id, 'imgURL': img_url})
        else:
            return jsonify({'status': 'error', 'message': '更新数据库失败'}), 500
    else:
        return jsonify({'status': 'error', 'message': '图片上传失败'}), 500


# 获取用户生成的所有图片及信息
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

# 获取指定 assignmentID 的记录
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
