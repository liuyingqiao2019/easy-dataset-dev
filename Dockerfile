# 使用Node.js 18作为基础镜像
FROM docker.1ms.run/library/node:18

# 设置工作目录
WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制package.json和package-lock.json
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install

# 复制所有文件
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 1717

# 启动应用
CMD ["npm", "start"]