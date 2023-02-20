FROM nginx
RUN rm -rf /usr/share/nginx/html/* -rf
COPY . /usr/share/nginx/html/
CMD ["nginx", "-g", "daemon off;"]