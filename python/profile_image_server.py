import os
import cv2
import requests

import numpy as np
from PIL import ImageFont, ImageDraw, Image

from flask import Flask
from flask_restful import reqparse, Api, Resource

# TODO: move to a separate config file
rank_names = {
    "0-0": "不堪一击（需要完成初始任务）",
    "1-9": "初窥门径",
    "10-19": "略有小成",
    "20-24": "心领神会",
    "25-29": "出类拔萃",
    "30-34": "傲视群雄",
    "35-39": "举世无双",
    "40-44": "天人合一",
    "45-49": "返璞归真",
    "50-100": "天下无敌"
}

# TODO: move to a separate config file
role_names = {
    0: "超管",
    1: "管理员",
    2: "资深会员",
    3: "普通会员",
}

font_path = "ResourceHanRoundedCN-Regular.ttf"
font = ImageFont.truetype(font_path, 80)
font_small = ImageFont.truetype(font_path, 60)


def find_rank_name(level):
    for key in rank_names:
        start, end = key.split("-")
        if int(start) <= level <= int(end):
            return rank_names[key]
    return "尚未参与评级"

def trim_text(text, max_length=12):
    if len(text) > max_length:
        return text[:max_length] + "..."
    return text


def build_profile_image(payload):
    dc_tag = payload["dcTag"]
    dc_name = payload["dcName"] if payload["dcName"] else ""
    level = payload["level"]
    exp_current_level = payload["expCurrentLevel"]
    exp_current_user = payload["expCurrentUser"]
    tier = payload["tier"]

    avatar_url = f'https://cdn.discordapp.com/avatars/{payload["dcId"]}/{payload["avatarId"]}.png'

    canvas = cv2.imread("source.png", cv2.IMREAD_COLOR)
    canvas = cv2.resize(canvas, (1800, 300))

    try:
        avatar = requests.get(avatar_url)
        with open("avatar.jpg", "wb") as f:
            f.write(avatar.content)
        avatar = cv2.imread("avatar.jpg", cv2.IMREAD_COLOR)
        avatar = cv2.resize(avatar, (225, 225))
        canvas[35:260, 90:315] = avatar
    except:
        canvas[35:260, 90:315] = 0

    img_pil = Image.fromarray(canvas)
    draw = ImageDraw.Draw(img_pil)
    draw.text(
        (int(0.23 * canvas.shape[1]), int(0.04 * canvas.shape[0])),
        trim_text(dc_name),
        font=font,
        fill=(220, 120, 120, 0),
    )

    # draw title if applicable
    # draw.text((int(0.74 * canvas.shape[1]), int(0.04 * canvas.shape[0])),
    #             f'【{role_names[tier]}】',
    #             font = font,
    #             fill = (160, 160, 160, 100))

    # Draw the rank text
    draw.text(
        (int(0.40 * canvas.shape[1]), int(0.40 * canvas.shape[0])),
        f"会阶: {find_rank_name(level)}", 
        font=font_small,
        fill=(220, 220, 220, 0),
    )

    # Draw the level text
    draw.text(
        (int(0.23 * canvas.shape[1]), int(0.40 * canvas.shape[0])),
        f"等级: {level}",
        font=font_small,
        fill=(150, 180, 200, 0),
    )

    canvas = np.array(img_pil)

    # Draw the experience progress bar as a rounded corner rectangle with while background and blue fill
    cv2.rectangle(
        canvas,
        (int(0.23 * canvas.shape[1]), int(0.78 * canvas.shape[0])),
        (int(0.72 * canvas.shape[1]), int(0.81 * canvas.shape[0])),
        (200, 200, 200),
        -10,
    )
    cv2.rectangle(
        canvas,
        (int(0.23 * canvas.shape[1]), int(0.78 * canvas.shape[0])),
        # 0.42 = 0.72 - 0.3
        (
            int(0.23 * canvas.shape[1])
            + int(0.42 * (exp_current_user / (exp_current_level + 1e-3)) * canvas.shape[1]),
            int(0.81 * canvas.shape[0]),
        ),
        (220, 130, 130),
        -1,
    )

    # Draw exp text right after the progress bar
    cv2.putText(
        canvas,
        f"{exp_current_user}/{exp_current_level} EXP",
        (int(0.74 * canvas.shape[1]), int(0.83 * canvas.shape[0])),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.2,
        (255, 255, 255),
        2,
    )

    # Save the image
    cv2.imwrite(f"profile_{dc_tag}.jpg", canvas)

    # Remove avatar.jpg
    os.remove("avatar.jpg")


# The server will receive a POST request with a JSON payload containing the user's data (restful API)
class ProfileImage(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("dcName", type=str)
        parser.add_argument("dcTag", type=str)
        parser.add_argument("level", type=int)
        parser.add_argument("expCurrentLevel", type=int)
        parser.add_argument("expCurrentUser", type=int)
        parser.add_argument("tier", type=int)
        parser.add_argument("dcId", type=str)
        parser.add_argument("avatarId", type=str)
        args = parser.parse_args()
        try:
            build_profile_image(args)
            return {
                "message": "Profile image generated successfully",
                "error": None,
            }, 200
        except Exception as e:
            print(e)
            return {"error": str(e)}, 500


app = Flask(__name__)
api = Api(app)

api.add_resource(ProfileImage, "/profile_image")

if __name__ == "__main__":
    app.run(debug=True)
