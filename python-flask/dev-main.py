# https://blog.csdn.net/shifengboy/article/details/114274271
import base64
import os
from traceback import print_tb
import urllib.request
import numpy as np
import random
from flask import Flask, request, json
from flask import jsonify
import cv2 as cv
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote, urlencode
# 解决跨域问题
from flask_cors import CORS

import chardet
import sys
import io

app = Flask(__name__)
CORS(app, resources=r'/*', origins='*', allow_headers='Content-Type')

RenderLink = "http://202.120.188.3:21789"


@app.route('/hello')  # 这里不能为空
def hello_world():
    return 'Hello World!'


def ostu(img0, thresh1=0):
    gray = cv.cvtColor(img0, cv.COLOR_BGR2GRAY)  # 灰度化
    box = cv.boxFilter(gray, -1, (3, 3), normalize=True)  # 去噪
    _, binarized = cv.threshold(box, thresh1, 255, cv.THRESH_BINARY | cv.THRESH_OTSU)  # 二值化
    return binarized


# 将上传待识别的图片切割成正方形
def splitSquare(img):
    height, width, channels = img.shape
    side = min(height, width)
    x = (width - side) // 2
    y = (height - side) // 2
    cropped = img[y:y + side, x:x + side]
    resized = cv.resize(cropped, (256, 256), interpolation=cv.INTER_AREA)
    return resized


SAVE_PATH = '/root/SITP/'
# SAVE_PATH='./'
# 将生成的图片留个记录吧
def saveRenderImages(before_render, before_transparent, after_transparent):
    # 获取当前日期和时间
    now = datetime.now()
    date_folder = now.strftime("%Y-%m-%d")
    time_folder = now.strftime("%H-%M-%S")
    # 构建文件夹路径
    folder_path = os.path.join(SAVE_PATH, date_folder, time_folder)
    # 检查文件夹是否存在
    if not os.path.exists(folder_path):
        # 创建新的文件夹
        os.makedirs(folder_path)
        print(f"Created a new folder: {folder_path}")
    print("文件夹路径", folder_path)

    # 获取本次请求的cookie
    name = request.cookies.get("userId")
    print('userId', name, request.cookies)


    # 在以时间命名的文件夹中分别写入传入的三张图像
    # img_name = now.strftime(name + "_" + "before_render.png")
    # 好像这里有时候name会变成None，不太清楚什么情况...一报错就会整个寄，所以暂时删除
    img_name = now.strftime("before_render.png")
    img_path = os.path.join(folder_path, img_name)
    cv.imwrite(img_path, before_render)
    # img_name = now.strftime(name + "_" + "before_transparent.png")
    img_name = now.strftime("before_transparent.png")
    img_path = os.path.join(folder_path, img_name)
    cv.imwrite(img_path, before_transparent)
    # img_name = now.strftime(name + "_" + "after_transparent.png")
    img_name = now.strftime("after_transparent.png")
    img_path = os.path.join(folder_path, img_name)
    cv.imwrite(img_path, after_transparent)
    print("Save Three Images OK")


def http_post(url, data):
    res = urllib.request.urlopen(url, data)
    return res.read().decode('utf-8')




def ostu(img0, thresh1=0):
    gray = cv.cvtColor(img0, cv.COLOR_BGR2GRAY)  # 灰度化
    box = cv.boxFilter(gray, -1, (3, 3), normalize=True)  # 去噪
    _, binarized = cv.threshold(box, thresh1, 255, cv.THRESH_BINARY | cv.THRESH_OTSU)  # 二值化
    return binarized


@app.route('/meaning', methods=['POST'])
def getMeaning():
    data = request.get_data()
    jsondata = json.loads(data)
    url = jsondata["url"]

    params = {"if": "gb", "char": jsondata["word"].encode('utf-8')}

    result = {
        "success": True,
        "meaning": None
    }
    # sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')  # 改变标准输出的默认编码
    try:

        response = requests.get(url, params=params)
        response.close()
        print(response.url)

        response.raise_for_status()  # 检查是否成功获取页面
        print("soup")
        # 使用 BeautifulSoup 解析页面内容

        response.encoding = 'utf-8'

        soup = BeautifulSoup(response.content, 'html.parser', from_encoding="utf-8")
        all_table = soup.find_all('table')
        dst_table = ""
        for t in all_table:
            classes = t.get('class')
            if classes and classes[0] == 'info':
                dst_table = t

        all_tr = dst_table.find_all('tr')
        print(len(all_tr))
        for tr in all_tr:
            all_th = tr.find_all('th')
            all_td = tr.find_all('td')
            print(all_th[0].get_text())
            if (all_th[0].get_text().strip() == "英文翻譯:"):
                result["meaning"] = all_td[0].get_text().strip()
                break

    except requests.exceptions.HTTPError as http_err:
        # 如果发生 HTTP 错误，会进入这个异常处理块
        print(f'HTTP 错误：{http_err}')

    except Exception as e:
        print("Exception")
        # 处理异常，例如页面不存在或无法访问

        # 但是测试时发现meaning这个接口会出现调用次数过多而禁止访问的情况
        # 这种情况下只有meaning接口有问题，但依然报错“网络问题”导致整个项目无法进入下一阶段
        # 感觉这样设置不是很合理，因此这里将抛出错误后的success也置为True了，返回为“测试含义”
        result = {
            "success": True,
            "message": str(e),
            # "meaning": "测试含义"
            "meaning": ""
        }

    print(result)
    return jsonify(result)

# 已弃用的upload接口
UPLOAD_PATH='/var/www/html/images'
# UPLOAD_PATH = './images'
@app.route('/upload', methods=['POST'])
def upload_pic():
    # name = request.cookies.get("userId")
    data = request.get_data()  # 接收json数据
    jsondata = json.loads(data)  # json数据解析
    base64_data = jsondata["data"]
    parts = base64_data.split(',')
    img_type = parts[0].split(':')[1].split(';')[0].rsplit('/', 1)[1]  # 图片类型，如"png"
    img_data = parts[1]  # base64编码本体
    img_data = base64.b64decode(img_data)

    nparr = np.frombuffer(img_data, np.uint8)
    img = cv.imdecode(nparr, cv.IMREAD_COLOR)
    img_name = 'MuseumCanvas' + '.' + img_type
    cv.imwrite(os.path.join(UPLOAD_PATH, img_name), img)  # 保存输入的图片

    respose = {
        'urls': "http://139.196.197.42:81/images/{}".format(img_name),
    }
    return jsonify(respose)


@app.route('/recognize', methods=['POST'])
def get_demo():
    data = request.get_data()  # 接收json数据
    jsondata = json.loads(data)  # json数据解析

    #####################################################
    base64_data = jsondata["data"]
    parts = base64_data.split(',')
    img_type = parts[0].split(':')[1].split(';')[0].rsplit('/', 1)[1]  # 图片类型，如"png"
    img_data = parts[1]  # base64编码本体
    img_data = base64.b64decode(img_data)

    nparr = np.frombuffer(img_data, np.uint8)
    img = cv.imdecode(nparr, cv.IMREAD_UNCHANGED)
    img = splitSquare(img)
    cv.imwrite('resize_image.' + img_type, img)  # 保存输入的图片


    # 识别模型是只能识别test.jpg,得先将图片转码为 JPG 格式才能正常识别

    # 将img转为jpg格式的图像数据
    _, img_encoded = cv.imencode('.jpg', img)
    # 将jpg格式的图像数据编码为base64字符串
    jpg_base64_code = base64.b64encode(img_encoded).decode('utf-8')
    # 将base64字符串添加到data URI中
    base64_data = "data:image/jpeg;base64," + jpg_base64_code

    jsondata["data"] = base64_data
    #######################################################

    # 使用urlencode将字典参数序列化成字符串
    data_string = urllib.parse.urlencode(jsondata)
    # 将序列化后的字符串转换成二进制数据，因为post请求携带的是二进制参数
    last_data = bytes(data_string, encoding='utf-8')
    # print("准备向服务器发送请求", last_data)
    # 向服务器发送请求
    res_url = ''
    unicode = 0
    ch = ''
    code = 0
    try:
        res = http_post("http://202.120.188.3:21789/api/recognize", last_data)
        jsondata = json.loads(res)
        # print("获得结果", jsondata)
        res_url = jsondata['url']
        unicode = jsondata['unicode']
        # 将后缀由png改为jpg、端口号为81
        res_url = 'http://139.196.197.42:81' + res_url[21:-4] + '.jpg'
        ch = jsondata['character']
        code = 200

    except urllib.error.HTTPError as e:
        print("HTTPERROR", e)
        code = e.code

    except urllib.error.URLError as e:
        print("URLERROR", e)
        error_code = None
        code = error_code

    # wordTypeList = ["JiaGu", "DaZhuan", "XiaoZhuan", "LiShu"]
    # retList = []
    # for wordType in wordTypeList:
    #     print('./' + wordType + '/' + str(unicode))
    #     if os.path.isfile('./' + wordType + '/' + str(unicode) + '.png'):
    #         retList.append(1)
    #     else:
    #         retList.append(0)

    respose = {
        'url': res_url,
        'code': code,
        'unicode': unicode,
        'ch': ch,
        # 'exist': retList
    }
    print(respose)
    return jsonify(respose)

# 返回taskID
@app.route('/render', methods=['POST'])
def get_render():
    data = request.get_json()
    base64_data = data.get('base64', 'default')
    prompt_item = data.get('prompt', 'flower')  # 你不提供我就画花儿
    negative_prompt = data.get('negative_prompt', "blurry, watermark, text, signature, frame, cg render, lights")
    batch_size = data.get('batch_size', 1)
    n_iter = data.get('n_iter', 1)

    ###################################################
    parts = base64_data.split(',')
    # base64编码本体
    img_data = parts[1]
    # 将base64编码的字符串解码为字节数据
    image_data = base64.b64decode(img_data)
    # 将字节数据转为NumPy数组
    nparr = np.frombuffer(image_data, np.uint8)
    # 解码NumPy数组为OpenCV图像格式
    img = cv.imdecode(nparr, cv.IMREAD_UNCHANGED)
    width, height, _ = img.shape
    # print(width,height)

    # 记录渲染前的图片
    before_render = img

    image = cv.imencode('.png', img)[1]
    imageBase64 = str(base64.b64encode(image))[2:-1]  # 转回base64
    parts = base64_data.split(',')
    head = parts[0]
    base64_data = head + ',' + imageBase64
    ####################################################

    # 发送渲染请求
    API_URL = RenderLink + "/sdapi/v1/img2img"
    HEADERS = {
        "Content-Type": "application/json"
    }
    DATA = {
        "init_images": [imageBase64],
        "sampler_name": "DPM++ 2S a Karras",
        "denoising_strength": 0.98,
        "image_cfg_scale": 0,
        "mask_blur": 4,
        "inpainting_fill": 0,
        "inpaint_full_res": True,
        "prompt": "a photograph of [" + prompt_item + "] against a white background, 30mm, 1080p full HD, 4K, sharp focus.",
        "negative_prompt": negative_prompt,
        "seed": -1,
        "subseed": -1,
        "subseed_strength": 0,
        "seed_resize_from_h": -1,
        "seed_resize_from_w": -1,
        "batch_size": batch_size,
        "n_iter": n_iter,
        "steps": 18,
        "cfg_scale": 9,
        "width": 512,
        "height": 512,
        "styles": [
            "8K 3D"
        ],
    }
    print("渲染标签prompt：", DATA["prompt"])
    json_data = json.dumps(DATA).encode('utf8')
    response = requests.post(url=API_URL, headers=HEADERS, data=json_data)
    res = json.loads(response.text)
    print("response",response.status_code)

    parts = base64_data.split(',')
    head = parts[0]
    res_img_base64 = head + ',' + res["images"][0]
    ########################################################

    # 再将结果转为cv img格式，以下将进行透明处理
    parts = res_img_base64.split(',')
    img_type = parts[0].split(':')[1].split(';')[0].rsplit('/', 1)[1]  # 图片类型，如"png"
    img_data = parts[1]  # base64编码本体
    img_data = base64.b64decode(img_data)
    # 转为numpy格式数组
    nparr = np.frombuffer(img_data, np.uint8)
    # 提取图像的三个通道（红、绿、蓝和 alpha 通道）
    img = cv.imdecode(nparr, cv.IMREAD_COLOR)
    # 记录渲染后透明前的图片
    before_transparent = img
    # 转换为灰度图像
    gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
    # 使用阈值技术来创建二值图像
    threshold_value = 200
    ret, threshold = cv.threshold(gray, threshold_value, 255, cv.THRESH_BINARY_INV)
    # 创建掩模mask，将接近白色的像素赋为透明色（alpha=0）
    rgba = cv.cvtColor(img, cv.COLOR_BGR2RGBA)
    rgba[:, :, 3] = threshold

    # ##########################################
    # 注意这里opencv的RGB是反着的，为了避免最后绿色变蓝色，这里颠倒一下 #
    # ##########################################
    red, green, blue, alpha = cv.split(rgba)
    rgba = cv.merge((blue, green, red, alpha))
    # 记录渲染后透明前的图片
    after_transparent = rgba
    # ##########################################
    # 注意这里opencv的RGB是反着的，为了避免最后绿色变蓝色，这里颠倒一下 #
    # ##########################################

    # 又转为base64
    image = cv.imencode('.png', rgba)[1]
    base64_without_head = str(base64.b64encode(image))[2:-1]  # 转回base64
    response = {
        'base64': head + ',' + base64_without_head,
        'width': 512,
        'height': 512
    }
    saveRenderImages(before_render, before_transparent, after_transparent)
    return jsonify(response)


# 根据taskID取图片url


import random
import hashlib
import time

BAIDU_TRANSLATOR_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
APP_ID = '20230607001704227'
SECRET_KEY = 'd3Ro7sijeyUU6iF1Sm31'



@app.route('/translate', methods=['POST'])
def cn_to_en():
    # 从 POST 请求中获取要翻译的文字
    data = request.get_data()  # 接收json数据
    jsondata = json.loads(data)  # json数据解析
    text = jsondata["text"]
    print("要翻译的text",text)

    # 调用百度翻译 API 进行翻译
    params = {
        'q': text,
        'from': 'zh',
        'to': 'en',
        'appid': APP_ID,
        'salt': random.randint(10000, 99999),
        'sign': '',  # 签名在下面生成
    }

    sign_str = APP_ID + text + str(params['salt']) + SECRET_KEY
    sign = hashlib.md5(sign_str.encode()).hexdigest()
    params['sign'] = sign

    response = requests.get(BAIDU_TRANSLATOR_API_URL, params=params)
    result = response.json()
    time.sleep(1)

    # 如果翻译成功，返回翻译结果
    if 'trans_result' in result:
        return jsonify({'status': 'ok', 'translation': result['trans_result'][0]['dst']})
    # 否则返回错误信息
    else:
        return jsonify({'status': 'error', 'error': result['error_msg']})

# 修正base64填充
def correct_base64_padding(base64_string):
    missing_padding = len(base64_string) % 4
    if missing_padding != 0:
        base64_string += '=' * (4 - missing_padding)
    return base64_string

# 整体渲染
@app.route('/integration', methods=['POST'])
def integration_render():
    print("in integration_render")
    # data=request.get_data()
    # # print(data)
    # jsondata = json.loads(data)
    # print(jsondata)
    # print(jsondata["formData"])
    # img=jsondata['image']
    # cn_prompt=jsondata['text']
    cn_prompt = request.form['text']
    print("cn_prompt is ",cn_prompt)


    # 调用百度翻译 API 进行翻译
    params = {
        'q': cn_prompt,
        'from': 'zh',
        'to': 'en',
        'appid': APP_ID,
        'salt': random.randint(10000, 99999),
        'sign': '',  # 签名在下面生成
    }

    sign_str = APP_ID + cn_prompt + str(params['salt']) + SECRET_KEY
    sign = hashlib.md5(sign_str.encode()).hexdigest()
    params['sign'] = sign
    try:
        response = requests.get(BAIDU_TRANSLATOR_API_URL, params=params)
        result = response.json()

    except Exception as e:
        print(e)
        result=None

    # 如果翻译成功，返回翻译结果
    if result and 'trans_result' in result:
        prompt=result['trans_result'][0]['dst']
    # 否则返回错误信息
    else:
        prompt=None

    img_base64 = request.form['image']
    # print(img_base64)
    # img=base64.b64decode(img_base64.split(',')[1])
    #
    # nparr = np.frombuffer(img, np.uint8)
    # # 解码NumPy数组为OpenCV图像格式
    # # print(nparr)
    # img = cv.imdecode(nparr, cv.IMREAD_UNCHANGED)
    # RenderLink = "http://10.50.31.201:7862"
    RenderLink = "http://10.50.31.201:21789/controlnet"
    API_URL = RenderLink + "/sdapi/v1/txt2img"
    HEADERS = {
        "Content-Type": "application/json"
    }
    if prompt:
        prompt+=",masterpiece,realistic,8k"
    else:
        prompt=cn_prompt+"，杰作"+"，真实"+",8k"

    print(prompt)
    data = {
        "prompt": prompt,
        # "negative_prompt": "blurry, watermark, text, signature, frame, cg render, lights",
        "negative_prompt": "white background,simple background",
        "batch_size": 1,
        "cfg_scale": 7,
        # "clip_skip": 2,
        "restore_faces": False,
        "sampler_name": "DPM++ SDE Karras",
        "seed": -1,
        "steps": 40,
        "tiling": False,
        "width": 512,
        "height": 512,
        "alwayson_scripts": {
            "controlnet":
                {
                    "args": [
                        {
                            "enabled": True,  # 启用
                            "control_mode": 0,
                            # 对应webui 的 Control Mode 可以直接填字符串 推荐使用下标 0 1 2
                            "model": "control_v11f1e_sd15_tile [a371b31b]",
                            # 对应webui 的 Model
                            "module": "tile_resample",
                            # 对应webui 的 Preprocessor
                            "weight": 0.65,  # 对应webui 的Control Weight
                            "resize_mode": "Crop and Resize",
                            # "threshold_a": 200,  # 阈值a 部分control module会用上
                            # "threshold_b": 245,  # 阈值b
                            # "guidance_start": 0,  # 什么时候介入 对应webui 的 Starting Control Step
                            # "guidance_end": 0.7,  # 什么时候退出 对应webui 的 Ending Control Step
                            "pixel_perfect": True,  # 像素完美
                            "processor_res": 512,  # 预处理器分辨率
                            "save_detected_map": False,
                            # 因为使用了 controlnet API会返回生成controlnet的效果图，默认是True，如何不需要，改成False
                            "input_image": img_base64,  # 图片 格式为base64

                        }
                        # 多个controlnet 在复制上面一个字典下来就行
                    ]
                }
        },

    }

    json_data = json.dumps(data).encode('utf8')
    response = requests.post(url=API_URL, headers=HEADERS, data=json_data)
    print("receive response")
    res = json.loads(response.text)

    parts = img_base64.split(',')
    head = parts[0]
    # res_img_base64 = head + ',' + res["images"][0]
    res_img_base64 = res["images"][0]
    res_img_base64 = correct_base64_padding(res_img_base64)
    # print(res_img_base64)

    decoded_data = base64.b64decode(res_img_base64)

    # 将原始数据转换为numpy数组
    np_data = np.frombuffer(decoded_data, np.uint8)

    # 从numpy数组中解码图像
    image = cv.imdecode(np_data, cv.IMREAD_COLOR)

    # 保存图像为PNG文件
    cv.imwrite("./text2img.png", image)
    ret = {
        'base64': head + ',' + res_img_base64,
        'width': 512,
        'height': 512
    }



    # width, height, _ = img.shape
    # cv.imwrite('saved_image.jpg', img)
    # img = request.files['image']


    # print("img is ",img)


    return jsonify(ret)

#################
# 书写练习
#################
@app.route('/getListAndCharacters', methods=['GET'])
def getList():
    print("in getList")
    listName = request.args.get('listName')
    listName="result"
    # print(listName)

    # 指定文件夹路径
    folder_path = '/path/to/your/folder/'

    # 拼接文件路径
    file_path = '.././lists/'+listName+'.txt'
    # print(file_path)

    # 打开文件并读取内容
    try:
        with open(file_path, 'r',encoding='utf-8') as file:
            ori_content = file.read().split('\n')

            # print(ori_content)


    except FileNotFoundError:
        print("文件不存在或路径错误。")
    except IOError:
        print("文件读取错误。")


    content=[]
    for row in ori_content:
        if len(row) == 0:
            continue
        content.append(row)

    random.shuffle(content)
    content=content[:150]
    print(len(content))

    ret={"list":content,
         "characters":[]}
    if content:
        for ch in content:
            if len(ch)==0:
                continue
            ch_path='.././characters/'+str(ord(ch))+'.json'
            with open(ch_path,'r',encoding='utf-8') as f:
                jsondata=json.load(f)
                # print(jsondata)
                ret['characters'].append(jsondata)

    # ret = {"list": content[:2],
    #        "characters": ret['characters'][:2]}
    # print(ret)

    # print('刀',ord('刀'))
    # print('刁',ord('刁'))
    return ret



import image_manager

app = Flask(__name__)

# 绑定openID与图片的接口
@app.route('/bind_openid_to_picture', methods=['POST'])
def bind_openid_to_picture():
    data = request.get_json()
    open_id = data.get('openID')
    picture_id = data.get('pictureID')

    if not open_id or not picture_id:
        return jsonify({'status': 'error', 'message': 'openID或pictureID缺失'}), 400

    user_id = image_manager.get_user_id_by_openid(open_id)

    if user_id is None:
        return jsonify({'status': 'error', 'message': '未找到对应的userID'}), 400

    success = image_manager.insert_image_info(user_id, picture_id)

    if success:
        return jsonify({'status': 'success', 'message': '绑定成功并插入图片信息'})
    else:
        return jsonify({'status': 'error', 'message': '插入图片信息失败'}), 500


# 上传接口1：处理prompt和character
@app.route('/upload_prompt_character', methods=['POST'])
def upload_prompt_character():
    data = request.get_json()
    prompt = data.get('prompt', '')
    character = data.get('character', '')
    components = data.get('components', [])

    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    success = image_manager.insert_prompt_character(prompt, character, components, current_time)

    if success:
        assignment_id = image_manager.get_last_assignment_id()
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


if __name__ == '__main__':
    # app.add_url_rule('/', 'hello', hello_world)   # 与@app二选一
    app.run(host='127.0.0.1', port=8080, debug=True)
