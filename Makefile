local-server:
	cd docs && python3 -m http.server

tags:
	find . -name '*.html' -o -name '*.js' -o -name '*.css' | xargs etagsc
