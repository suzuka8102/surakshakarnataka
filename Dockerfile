FROM nginx:alpine
COPY dist /usr/share/nginx/html
RUN echo 'server { \
    listen $PORT default_server; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
CMD sh -c "sed -i 's/\$PORT/'\"$PORT\"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
