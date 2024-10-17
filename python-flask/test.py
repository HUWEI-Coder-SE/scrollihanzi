import requests

# 微信登录接口的URL
url = 'http://127.0.0.1:6000/wechat_login'  # 请根据实际的服务端地址修改

# 构造POST请求的json数据
data = {
    'appID': 'wx636d1daf20b6a276',  # 替换为实际的appID
    'code': '0d3zTG000Rq82T1uEV200GgyK04zTG0d'  # 替换为实际的微信临时code
}

try:
    # 发送POST请求
    response = requests.post(url, json=data)

    # 输出返回的结果
    if response.status_code == 200:
        print('接口调用成功')
        print('响应数据:', response.json())
    else:
        print(f'接口调用失败，状态码: {response.status_code}')
        print('响应数据:', response.json())

except Exception as e:
    print(f'接口调用出现异常: {str(e)}')
