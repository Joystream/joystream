FROM joystream/rust-builder AS node-build
LABEL description="Compiles joystream substrate node"

WORKDIR /joystream
# if source files change will the intermediate image be rebuilt?
COPY . /joystream
ENV TERM=xterm

RUN cargo build --release

FROM debian:stretch
LABEL description="Joystream node"

WORKDIR /joystream
ENV TERM=xterm

COPY --from=node-build /joystream/target/release/joystream-node /joystream

# Use these volumes to persits chain state and keystore, eg.:
# --base-path /data
# optionally separate keystore (otherwise it will be stored in the base path)
# --keystore-path /keystore
# if basepath isn't specified it will be inside container in ~/.local/share/joystream-node/
VOLUME ["/data", "/keystore"]

ENTRYPOINT ["/joystream/joystream-node"]