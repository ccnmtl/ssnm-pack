OUTPUT_PATH=dist
JS_FILES=src test

all: clean test jshint jscs

include js.mk

clean:
	rm -rf $(OUTPUT_PATH)

build:  $(JS_SENTINAL)
	./node_modules/webpack/bin/webpack.js --output-path=$(OUTPUT_PATH)

build-test: $(JS_SENTINAL)
	./node_modules/webpack/bin/webpack.js --config test/test.webpack.config.js --output-path=$(OUTPUT_PATH)

test: build build-test
	npm test

test-unit: build build-test
	npm run test-unit

test-client: build-test
	npm run test-client

publish: build
	npm publish --access=public

runserver: build
	npm run serve
