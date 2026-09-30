FROM python:3.12-slim AS bundle
WORKDIR /source
COPY build.py *.html *.js *.css *.json ./
COPY assets ./assets
COPY themes ./themes
COPY books ./books
COPY covers ./covers
COPY español-songs ./español-songs
COPY audio-library ./audio-library
RUN python build.py
FROM python:3.12-slim
WORKDIR /app
COPY platform/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd --uid 10001 --create-home syolana
COPY platform/server.py platform/manage.py ./
COPY --from=bundle /source/dist/public ./public
COPY --from=bundle /source/dist/private_lessons ./private_lessons
RUN mkdir /data && chown syolana:syolana /data
USER syolana
ENV DATA_DIR=/data PUBLIC_DIR=/app/public PRIVATE_LESSONS_DIR=/app/private_lessons
EXPOSE 8080
CMD ["gunicorn","--bind","0.0.0.0:8080","--workers","2","--threads","4","--timeout","60","--access-logfile","-","server:application"]
