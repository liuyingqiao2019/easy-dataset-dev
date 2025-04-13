# 使用Node.js 18作为基础镜像
FROM docker.1ms.run/library/node:18

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN npm install

# 复制所有文件
COPY . .

# 构建应用
RUN npm build

# 暴露端口
EXPOSE 1717

# 启动应用
CMD ["npm", "start"]