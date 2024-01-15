FROM nginx:1.19.0
COPY nginx /etc/nginx
COPY html /usr/share/nginx/html
EXPOSE 80
