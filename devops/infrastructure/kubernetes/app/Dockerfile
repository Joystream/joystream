FROM ipfs/go-ipfs:latest

EXPOSE 8080 5001

# New startup script
ADD container_daemon /usr/local/bin/start_ipfs
RUN chmod 0755 /usr/local/bin/start_ipfs
