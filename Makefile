build:

CONTAINER_PORT=8080
LOCAL_PORT=8080
NAME=harambe_user_service
VERSION=$(shell git rev-parse HEAD)

build:
	docker build -t $(NAME):$(VERSION) ./

# run terminal inside of container and mirror changes outside of container
# clean up after exit (ctrl+d)
# note that order of args matters
debug:
	docker run -it --rm \
		--volume $(shell pwd):/app \
		--env-file=.env \
		-p $(LOCAL_PORT):$(CONTAINER_PORT) \
		$(NAME):$(VERSION) /bin/bash \

run:
	docker run -p $(LOCAL_PORT):$(CONTAINER_PORT) \
		--env-file=.env \
		$(NAME):$(VERSION)

clean:
	docker stop $(NAME):$(VERSION)