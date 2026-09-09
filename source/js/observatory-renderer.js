(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var STRIDE = 20;
  var VERTEX_SOURCE = [
    'attribute vec3 aSpherePosition;',
    'attribute vec3 aSphereNormal;',
    'attribute vec3 aTorusPosition;',
    'attribute vec3 aTorusNormal;',
    'attribute vec3 aHelixPosition;',
    'attribute vec3 aHelixNormal;',
    'attribute vec2 aUv;',
    'uniform mediump vec3 uWeights;',
    'uniform mat3 uRotation;',
    'uniform float uAspect;',
    'uniform float uLens;',
    'varying mediump vec3 vNormal;',
    'varying mediump vec3 vPosition;',
    'varying mediump vec2 vUv;',
    'void main() {',
    '  vec3 position = aSpherePosition * uWeights.x + aTorusPosition * uWeights.y + aHelixPosition * uWeights.z;',
    '  vec3 normal = aSphereNormal * uWeights.x + aTorusNormal * uWeights.y + aHelixNormal * uWeights.z;',
    '  vNormal = uRotation * normal;',
    '  vPosition = uRotation * position;',
    '  vPosition.z -= 5.0;',
    '  vUv = aUv;',
    '  float depth = -vPosition.z;',
    '  gl_Position = vec4(uLens * vPosition.x / uAspect, uLens * vPosition.y + 0.12 * depth, 1.006689 * depth - 0.200669, depth);',
    '}'
  ].join('\n');

  var FRAGMENT_SOURCE = [
    'precision mediump float;',
    'uniform mediump vec3 uWeights;',
    'uniform float uOrbit;',
    'varying mediump vec3 vNormal;',
    'varying mediump vec3 vPosition;',
    'varying mediump vec2 vUv;',
    'float line(float coordinate, float width) {',
    '  float edge = min(fract(coordinate), 1.0 - fract(coordinate));',
    '  return 1.0 - smoothstep(width * 0.5, width, edge);',
    '}',
    'void main() {',
    '  vec3 normal = normalize(vNormal + vec3(0.0, 0.0, 0.0001));',
    '  if (!gl_FrontFacing) normal = -normal;',
    '  vec3 view = normalize(-vPosition);',
    '  vec3 reflected = reflect(-view, normal);',
    '  float facing = max(dot(normal, view), 0.0);',
    '  float fresnel = pow(1.0 - facing, 3.2);',
    '  float sphereGold = smoothstep(0.085, 0.10, abs(vUv.y - 0.54));',
    '  float torusGold = 1.0 - 0.94 * smoothstep(0.58, 0.64, cos(vUv.x * 37.6991));',
    '  float helixGold = smoothstep(0.12, 0.15, abs(vUv.y - 0.5));',
    '  float gold = dot(vec3(sphereGold, torusGold, helixGold), uWeights);',
    '  gold = mix(gold, 1.0, uOrbit);',
    '  vec3 metal = mix(vec3(0.035, 0.042, 0.051), vec3(0.72, 0.55, 0.34), gold);',
    '  float etching = max(line(vUv.x * 24.0, 0.033), line(vUv.y * 12.0, 0.035));',
    '  float dotted = 1.0 - smoothstep(0.04, 0.075, length(fract(vUv * vec2(24.0, 12.0)) - 0.5));',
    '  float marks = mix(etching * 0.18, line(vUv.x * 48.0, 0.12) * 0.23, uOrbit);',
    '  metal *= 1.0 - marks;',
    '  vec3 keyDirection = normalize(vec3(-0.60, 0.95, 1.35));',
    '  vec3 fillDirection = normalize(vec3(0.95, 0.15, 0.3));',
    '  float keyDiffuse = max(dot(normal, keyDirection), 0.0);',
    '  float fillDiffuse = max(dot(normal, fillDirection), 0.0);',
    '  float keyReflection = pow(max(dot(reflected, keyDirection), 0.0), 11.0);',
    '  float softbox = pow(max(dot(reflected, normalize(vec3(-0.45, 1.15, 1.1))), 0.0), 38.0);',
    '  float coolReflection = pow(max(dot(reflected, normalize(vec3(1.3, 0.30, 0.40))), 0.0), 22.0);',
    '  float horizon = smoothstep(-0.48, 0.52, reflected.y);',
    '  float darkRoom = smoothstep(-0.18, 0.12, reflected.y) * (1.0 - smoothstep(0.18, 0.42, reflected.y));',
    '  vec3 color = metal * (0.15 + 0.22 * horizon + 0.28 * keyDiffuse + 0.055 * fillDiffuse);',
    '  color *= 1.0 - darkRoom * 0.32;',
    '  color += mix(vec3(0.52, 0.59, 0.69), metal, 0.75 * gold) * keyReflection * 1.15;',
    '  color += mix(vec3(0.77, 0.85, 0.94), vec3(1.0, 0.91, 0.74), gold) * softbox * 0.82;',
    '  color += vec3(0.42, 0.56, 0.69) * coolReflection * (0.3 + 0.3 * fresnel);',
    '  color += vec3(0.36, 0.43, 0.51) * fresnel * (0.16 + 0.12 * fillDiffuse);',
    '  color += dotted * (1.0 - uOrbit) * vec3(0.065, 0.048, 0.023);',
    '  color *= mix(1.0, 1.20, uOrbit);',
    '  color = color / (vec3(1.0) + color * 0.38);',
    '  gl_FragColor = vec4(pow(max(color, vec3(0.0)), vec3(0.454545)), 1.0);',
    '}'
  ].join('\n');

  /** Normalize numeric x/y/z components into a number[3]; zero-length vectors return [0, 0, 0]. */
  function normalize(x, y, z) {
    var length = Math.sqrt(x * x + y * y + z * z) || 1;
    return [x / length, y / length, z / length];
  }

  /** Rotate a number[3] vector by numeric X/Z angles in radians and return a new number[3]. */
  function tilt(vector, x, z) {
    var y = vector[1] * Math.cos(x) - vector[2] * Math.sin(x);
    var depth = vector[1] * Math.sin(x) + vector[2] * Math.cos(x);
    return [vector[0] * Math.cos(z) - y * Math.sin(z), vector[0] * Math.sin(z) + y * Math.cos(z), depth];
  }

  /** Append three position/normal pairs and UVs to a number[] using numeric u/v coordinates; returns nothing. */
  function addVertex(vertices, position, normal, torusPosition, torusNormal, helixPosition, helixNormal, u, v) {
    Array.prototype.push.apply(vertices, position);
    Array.prototype.push.apply(vertices, normal);
    Array.prototype.push.apply(vertices, torusPosition);
    Array.prototype.push.apply(vertices, torusNormal);
    Array.prototype.push.apply(vertices, helixPosition);
    Array.prototype.push.apply(vertices, helixNormal);
    vertices.push(u, v);
  }

  /** Append grid triangles to a number[] from numeric dimensions/base offset; indices remain Uint16 compatible. */
  function addGrid(indices, columns, rows, base) {
    for (var x = 0; x < columns; x++) {
      for (var y = 0; y < rows; y++) {
        var a = base + x * (rows + 1) + y;
        var b = a + rows + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }

  /** Build shared UV topology for three solids; returns {vertices: number[], indices: number[]} once per renderer. */
  function createBodyGeometry() {
    var vertices = [];
    var indices = [];
    var columns = 72;
    var rows = 36;
    for (var x = 0; x <= columns; x++) {
      var u = x / columns;
      var longitude = u * TAU;
      var cosU = Math.cos(longitude);
      var sinU = Math.sin(longitude);
      var helixAngle = u * TAU * 2.35 - Math.PI * 0.35;
      var cosHelix = Math.cos(helixAngle);
      var sinHelix = Math.sin(helixAngle);
      var tangent = normalize(-0.66 * sinHelix * TAU * 2.35, 2.1, 0.66 * cosHelix * TAU * 2.35);
      var radial = [cosHelix, 0, sinHelix];
      var cross = normalize(tangent[1] * radial[2], tangent[2] * radial[0] - tangent[0] * radial[2], -tangent[1] * radial[0]);
      var end = Math.min(1, u * columns, (1 - u) * columns);
      var cap = Math.sin(end * Math.PI / 2);
      for (var y = 0; y <= rows; y++) {
        var v = y / rows;
        var latitude = v * Math.PI;
        var sinV = Math.sin(latitude);
        var sphereNormal = [sinV * cosU, Math.cos(latitude), sinV * sinU];
        var crossAngle = -v * TAU;
        var cosCross = Math.cos(crossAngle);
        var sinCross = Math.sin(crossAngle);
        var torusNormal = [cosU * cosCross, sinCross, sinU * cosCross];
        var torusPosition = [(0.75 + 0.29 * cosCross) * cosU, 0.29 * sinCross, (0.75 + 0.29 * cosCross) * sinU];
        // A flattened, solid tube gives the helix a ribbon face and a polished edge.
        var helixOffset = [
          radial[0] * cosCross * 0.17 + cross[0] * sinCross * 0.24,
          cross[1] * sinCross * 0.24,
          radial[2] * cosCross * 0.17 + cross[2] * sinCross * 0.24
        ];
        var helixNormal = normalize(
          radial[0] * cosCross / 0.17 + cross[0] * sinCross / 0.24,
          cross[1] * sinCross / 0.24,
          radial[2] * cosCross / 0.17 + cross[2] * sinCross / 0.24
        );
        if (x === 0 || x === columns) {
          var direction = x === 0 ? -1 : 1;
          helixNormal = [tangent[0] * direction, tangent[1] * direction, tangent[2] * direction];
        }
        var helixPosition = [0.66 * cosHelix + cap * helixOffset[0], u * 2.1 - 1.05 + cap * helixOffset[1], 0.66 * sinHelix + cap * helixOffset[2]];
        addVertex(vertices, sphereNormal, sphereNormal, tilt(torusPosition, 0.82, -0.22), tilt(torusNormal, 0.82, -0.22), helixPosition, helixNormal, u, v);
      }
    }
    addGrid(indices, columns, rows, 0);
    return { vertices: vertices, indices: indices };
  }

  /** Build two slim solid orbit rings; returns {vertices: number[], indices: number[]} with shared material UVs. */
  function createOrbitGeometry() {
    var vertices = [];
    var indices = [];
    var columns = 96;
    var rows = 4;
    for (var orbit = 0; orbit < 2; orbit++) {
      var base = vertices.length / STRIDE;
      var radius = orbit === 0 ? 1.43 : 1.51;
      for (var x = 0; x <= columns; x++) {
        var u = x / columns;
        var longitude = u * TAU;
        for (var y = 0; y <= rows; y++) {
          var v = y / rows;
          var cross = -v * TAU + Math.PI / 4;
          var radial = Math.cos(cross);
          var position = [(radius + radial * 0.009) * Math.cos(longitude), Math.sin(cross) * 0.008, (radius + radial * 0.009) * Math.sin(longitude)];
          var normal = [radial * Math.cos(longitude), Math.sin(cross), radial * Math.sin(longitude)];
          position = tilt(position, orbit === 0 ? 0.92 : -0.44, orbit === 0 ? 0.36 : -0.62);
          normal = tilt(normal, orbit === 0 ? 0.92 : -0.44, orbit === 0 ? 0.36 : -0.62);
          addVertex(vertices, position, normal, position, normal, position, normal, u, v);
        }
      }
      addGrid(indices, columns, rows, base);
    }
    return { vertices: vertices, indices: indices };
  }

  /** Create a WebGL1 observatory for an HTMLCanvasElement; returns render/dispose methods and throws Error if initialization fails. */
  window.createObservatoryRenderer = function (canvas) {
    var gl = canvas.getContext('webgl', { alpha: true, depth: true, antialias: true, powerPreference: 'low-power', premultipliedAlpha: true });
    if (!gl) throw new Error('WebGL is unavailable.');
    var shaders = [];
    var buffers = [];
    var program = null;
    var disposed = false;
    var rotation = new Float32Array(9);
    var weights = new Float32Array([1, 0, 0]);
    var uniform;
    var body;
    var orbits;

    /** Compile GLSL source (string) for a numeric WebGL shader type; returns WebGLShader or throws Error with its log. */
    function compile(type, source) {
      var shader = gl.createShader(type);
      if (!shader) throw new Error('Unable to allocate an observatory shader.');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Unable to compile observatory shader.');
      return shader;
    }

    /** Upload a geometry object containing numeric vertices/indices once; returns its GPU buffers and index count, or throws Error. */
    function upload(geometry) {
      var vertex = gl.createBuffer();
      if (!vertex) throw new Error('Unable to allocate observatory vertices.');
      buffers.push(vertex);
      var index = gl.createBuffer();
      if (!index) throw new Error('Unable to allocate observatory indices.');
      buffers.push(index);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);
      return { vertex: vertex, index: index, count: geometry.indices.length };
    }

    /** Draw an uploaded mesh object with the numeric orbit material flag; returns nothing and allocates no buffers. */
    function draw(mesh, orbit) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertex);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index);
      for (var attribute = 0; attribute < 7; attribute++) {
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, attribute === 6 ? 2 : 3, gl.FLOAT, false, STRIDE * 4, attribute * 3 * 4);
      }
      gl.uniform1f(uniform.orbit, orbit);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }

    /** Release all renderer-owned GPU resources; takes no parameters, returns nothing, and tolerates repeated calls. */
    function dispose() {
      if (disposed) return;
      disposed = true;
      gl.useProgram(null);
      for (var i = 0; i < buffers.length; i++) gl.deleteBuffer(buffers[i]);
      if (program) gl.deleteProgram(program);
      for (var j = 0; j < shaders.length; j++) gl.deleteShader(shaders[j]);
      buffers.length = 0;
      shaders.length = 0;
    }

    /** Render numeric rotationX/rotationY, width/height, pixelRatio and weights:number[3] from a state object; returns nothing after disposal. */
    function render(state) {
      if (disposed || gl.isContextLost()) return;
      var width = Math.max(1, state.width || canvas.clientWidth || 1);
      var height = Math.max(1, state.height || canvas.clientHeight || 1);
      var pixelRatio = Math.max(1, Math.min(1.75, state.pixelRatio || 1));
      var pixelWidth = Math.round(width * pixelRatio);
      var pixelHeight = Math.round(height * pixelRatio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      var x = state.rotationX || 0;
      var y = state.rotationY || 0;
      var cosX = Math.cos(x);
      var sinX = Math.sin(x);
      var cosY = Math.cos(y);
      var sinY = Math.sin(y);
      rotation[0] = cosY;
      rotation[1] = sinX * sinY;
      rotation[2] = -cosX * sinY;
      rotation[3] = 0;
      rotation[4] = cosX;
      rotation[5] = sinX;
      rotation[6] = sinY;
      rotation[7] = -sinX * cosY;
      rotation[8] = cosX * cosY;
      if (state.weights) {
        weights[0] = state.weights[0];
        weights[1] = state.weights[1];
        weights[2] = state.weights[2];
      } else {
        var shape = state.shape === 1 || state.shape === 2 ? state.shape : 0;
        var fromShape = state.fromShape === 1 || state.fromShape === 2 ? state.fromShape : 0;
        var blend = typeof state.blend === 'number' ? Math.max(0, Math.min(1, state.blend)) : 1;
        weights[0] = 0;
        weights[1] = 0;
        weights[2] = 0;
        weights[fromShape] += 1 - blend;
        weights[shape] += blend;
      }
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      gl.uniform3fv(uniform.weights, weights);
      gl.uniformMatrix3fv(uniform.rotation, false, rotation);
      gl.uniform1f(uniform.aspect, width / height);
      gl.uniform1f(uniform.lens, 2.64 * Math.min(1, width / height * 1.14));
      draw(body, 0);
      draw(orbits, 1);
    }

    try {
      var vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SOURCE);
      var fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
      program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate observatory program.');
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      var attributes = ['aSpherePosition', 'aSphereNormal', 'aTorusPosition', 'aTorusNormal', 'aHelixPosition', 'aHelixNormal', 'aUv'];
      for (var attribute = 0; attribute < attributes.length; attribute++) gl.bindAttribLocation(program, attribute, attributes[attribute]);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Unable to link observatory program.');
      uniform = {
        weights: gl.getUniformLocation(program, 'uWeights'),
        rotation: gl.getUniformLocation(program, 'uRotation'),
        aspect: gl.getUniformLocation(program, 'uAspect'),
        lens: gl.getUniformLocation(program, 'uLens'),
        orbit: gl.getUniformLocation(program, 'uOrbit')
      };
      body = upload(createBodyGeometry());
      orbits = upload(createOrbitGeometry());
    } catch (error) {
      dispose();
      throw error;
    }

    return { render: render, dispose: dispose };
  };
}());
