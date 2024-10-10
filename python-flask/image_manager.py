import os
import oss2
import sqlite3
import random
from datetime import datetime

# 配置 OSS 相关参数
OSS_ACCESS_KEY_ID = ''
OSS_ACCESS_KEY_SECRET = ''
OSS_BUCKET_NAME = ''
OSS_ENDPOINT = 'https://oss-cn-shanghai.aliyuncs.com'

# 初始化 OSS 客户端
auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET_NAME)

def create_tables():
    conn = connect_db()
    cur = conn.cursor()

    # 创建用户表 userID_openID
    cur.execute('''
        CREATE TABLE IF NOT EXISTS userID_openID (
            userID INTEGER PRIMARY KEY AUTOINCREMENT,
            openID TEXT NOT NULL UNIQUE
        )
    ''')

    # 创建图片表 scrollUser，增加 assignmentID 并设置为自增
    cur.execute('''
        CREATE TABLE IF NOT EXISTS scrollUser (
            pictureID INTEGER,
            imgURL TEXT,
            time TEXT NOT NULL,
            prompt TEXT,
            character TEXT,
            userID INTEGER,
            assignmentID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            components TEXT,
            FOREIGN KEY (userID) REFERENCES userID_openID(userID) ON DELETE CASCADE
        )
    ''')

    # 为 userID 添加索引
    cur.execute('CREATE INDEX IF NOT EXISTS idx_userID ON scrollUser (userID)')

    conn.commit()
    conn.close()

# 数据库连接
def connect_db():
    return sqlite3.connect('scrollDB.db')

def create_user(openid):
    conn = connect_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO userID_openID (openID) VALUES (?)", (openid,))
        conn.commit()
        user_id = cur.lastrowid
        return user_id
    except Exception as e:
        print(f"创建用户时发生错误: {e}")
        return None
    finally:
        conn.close()

def update_userid_by_pictureid(user_id, picture_id):
    conn = connect_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE scrollUser SET userID = ? WHERE pictureID = ?
        """, (user_id, picture_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"更新 userID 时发生错误: {e}")
        return False
    finally:
        conn.close()


# 上传图片到 OSS，并生成随机 `pictureID`
def upload_image_to_oss(local_image_path):
    try:
        if not os.path.exists(local_image_path):
            raise FileNotFoundError(f"本地文件不存在: {local_image_path}")

        picture_id = random.randint(100000000, 999999999)
        folder_name = datetime.now().strftime('%Y-%m-%d')
        image_name = os.path.basename(local_image_path)
        oss_image_path = f"{folder_name}/{image_name}"

        with open(local_image_path, 'rb') as image_file:
            bucket.put_object(oss_image_path, image_file)

        img_url = bucket.sign_url('GET', oss_image_path, 60 * 60 * 24 * 365)
        return picture_id, img_url

    except Exception as e:
        print(f"上传图片时发生错误: {e}")
        return None, None

def update_image_url(assignment_id, img_url, picture_id):
    conn = connect_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE scrollUser SET imgURL = ?, pictureID = ? WHERE assignmentID = ?
        """, (img_url, picture_id, assignment_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"更新图片URL时发生错误: {e}")
        return False
    finally:
        conn.close()

def insert_prompt_character(prompt, character, components, current_time):
    conn = connect_db()
    cur = conn.cursor()
    try:
        # 将 components 列表转换为逗号分隔的字符串
        components_str = ','.join(components)
        cur.execute("""
            INSERT INTO scrollUser (prompt, character, components, time)
            VALUES (?, ?, ?, ?)
        """, (prompt, character, components_str, current_time))
        conn.commit()
        assignment_id = cur.lastrowid  # 获取插入的 assignmentID
        return assignment_id
    except Exception as e:
        print(f"插入发生错误: {e}")
        return None
    finally:
        conn.close()




def get_user_images(user_id):
    conn = connect_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM scrollUser WHERE userID = ?", (user_id,))
        rows = cur.fetchall()

        images = [
            {
                'pictureID': row[0],
                'imgURL': row[1],
                'time': row[2],
                'prompt': row[3],
                'character': row[4],
                'userID': row[5],
                'assignmentID': row[6],
                'components': row[7].split(',') if row[7] else []
            } for row in rows
        ]
        return images
    except Exception as e:
        print(f"获取用户图片信息时发生错误: {e}")
        return None
    finally:
        conn.close()


def get_user_id_by_openid(openid):
    conn = connect_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT userID FROM userID_openID WHERE openID = ?", (openid,))
        row = cur.fetchone()
        return row[0] if row else None
    except Exception as e:
        print(f"查询 userID 时发生错误: {e}")
        return None
    finally:
        conn.close()

def get_record_by_assignment_id(assignment_id):
    conn = connect_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM scrollUser WHERE assignmentID = ?", (assignment_id,))
        row = cur.fetchone()
        if row:
            # 将 components 字符串转换回列表
            components_list = row[7].split(',') if row[7] else []
            record = {
                'pictureID': row[0],
                'imgURL': row[1],
                'time': row[2],
                'prompt': row[3],
                'character': row[4],
                'userID': row[5],
                'assignmentID': row[6],
                'components': components_list
            }
            return record
        else:
            return None
    except Exception as e:
        print(f"获取记录时发生错误: {e}")
        return None
    finally:
        conn.close()



create_tables()
