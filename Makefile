OUTPUT_PATH=dist
JS_FILES=src test

all: clean test eslint

include js.mk

clean:
	rm -rf $(OUTPUT_PATH)

build:  $(JS_SENTINAL)
	./node_modules/webpack/bin/webpack.js --mode development --output-path=$(OUTPUT_PATH)

build-test: $(JS_SENTINAL)
	./node_modules/webpack/bin/webpack.js --mode development --config test/test.webpack.config.js --output-path=$(OUTPUT_PATH)

test: build build-test
	npm test

runserver: build
	npm run serve

publish: test
	./node_modules/webpack/bin/webpack.js --mode production --output-path=$(OUTPUT_PATH)
	npm publish --access=public
