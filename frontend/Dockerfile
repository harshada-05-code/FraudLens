# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency configs
COPY package*.json ./
RUN npm install

# Copy source code files
COPY . ./

# Pass VITE_API_URL argument to use during static build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy built files from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for React SPA routing
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose port 80 (Google Cloud Run default can also map to this port)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
