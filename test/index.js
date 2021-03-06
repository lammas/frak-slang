var test = require('tape');
var path = require('path');
var fs   = require('fs');
var util = require('util');

var frakSlang = require('../index');

function inspect(o) {
	console.log(util.inspect(o, { depth: null }));
}

function getSource(file, parent, done) {
	if (!parent) {
		file = path.join(__dirname, file);
	}
	else {
		file = path.join(path.dirname(parent), file);
	}
	fs.readFile(file, 'utf8', function(err, data) {
		if (err)
			throw err;
		done(data, file);
	});
}

test('Preprocessor', function(t) {
	var file = path.join(__dirname, 'preprocess.glsl');
	var src = fs.readFileSync(file).toString();

	var file_success = path.join(__dirname, 'preprocess_success.glsl');
	var src_success = fs.readFileSync(file_success).toString();

	frakSlang.preprocess(src, {
		include: getSource,
		sourceURI: file
	}, function(compiledSource) {
		t.equal(compiledSource, src_success, 'Preprocessed code is correct');
		t.end();
	});
});

test('Preprocessor - circular include', function(t) {
	var file = path.join(__dirname, 'circular.glsl');
	var src = fs.readFileSync(file).toString();

	var file_success = path.join(__dirname, 'circular_success.glsl');
	var src_success = fs.readFileSync(file_success).toString();

	frakSlang.preprocess(src, {
		include: getSource,
		sourceURI: file
	}, function(compiledSource) {
		t.equal(compiledSource, src_success, 'Preprocessed code is correct');
		t.end();
	});
});


test('Extractor', function(t) {
	var file = path.join(__dirname, 'test.glsl');
	var src = fs.readFileSync(file).toString();

	var result = frakSlang.extract(src);
	t.notEqual(result, null, 'Parsing successful');
	t.ok('position' in result.attributes, 'position attribute extracted');
	t.ok('normal' in result.attributes, 'normal attribute extracted');
	t.ok('texcoord2d0' in result.attributes, 'texcoord2d0 attribute extracted');

	t.ok('projection' in result.uniforms, 'uniform "projection" extracted');
	t.ok('modelview' in result.uniforms, 'uniform "modelview" extracted');
	t.ok('diffuse' in result.uniforms, 'uniform "diffuse" extracted');
	t.ok('diffuse0' in result.uniforms, 'uniform "diffuse0" extracted');
	t.ok('magic' in result.uniforms, 'uniform "magic" extracted');

	t.ok('uv0' in result.varyings, 'varying "uv0" extracted');

	t.ok('bias' in result.globals, 'global "bias" extracted');
	t.ok('scale' in result.globals, 'global "scale" extracted');

	t.ok('lighting' in result.functions, 'function "lighting" extracted');
	t.ok('fragment' in result.functions, 'function "fragment" extracted');
	t.ok('vertex' in result.functions, 'function "vertex" extracted');

	t.end();
});


test('Compiler', function(t) {
	var src = fs.readFileSync(path.join(__dirname, 'test.glsl')).toString();
	var vert_success = fs.readFileSync(path.join(__dirname, 'test_success.vert')).toString();
	var frag_success = fs.readFileSync(path.join(__dirname, 'test_success.frag')).toString();

	var extracted = frakSlang.extract(src);
	var compiled = frakSlang.compileExtracted(extracted);

	t.notEqual(extracted, null, 'Parsing successful');
	t.notEqual(compiled, null, 'Compiling successful');

	t.equal(compiled.vertex, vert_success, 'Vertex OK');
	t.equal(compiled.fragment, frag_success, 'Fragment OK');

	// console.log('\nVertex program:');
	// console.log(compiled.vertex);
	// console.log('\nFragment program:');
	// console.log(compiled.fragment);

	t.end();
});
