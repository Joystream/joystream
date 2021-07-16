FROM docker.elastic.co/beats/filebeat:7.13.3
COPY ./filebeat.docker.yml /usr/share/filebeat/filebeat.yml
USER root
RUN chown root:filebeat /usr/share/filebeat/filebeat.yml
USER filebeat
