# TOB

## Setup

Clone the repo

### Python Env

Use conda/venv

```
cd PROJECT_PATH/python
pip install -r requirements.txt

# may need to install extra lib due to opencv requirement, depends on your local env
```

### Node Env

```
npm install .  # to install all the node_modules
npm install pm2 -g  # install pm2
```

### PM2

```
pm2 list  # check running status
pm2 start index.js  # equivalent to `node index.js`

cd python
pm2 start profile_image_server.py # equivalent to `python profile_image_server.py`

# in case need to restart a service
# find id by
pm2 list
# detele the process
pm2 delete <id>
pm2 start `.py or .js`
```

## How to start?

```
cd python
python profile_image_server.py &

cd ..
node index.js
```