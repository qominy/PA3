import { Model } from './model.js';
import { TrackballRotator } from './Utils/trackball-rotator.js';
import { ShaderProgram } from './shader.js';

let gl;
let surface;
let shProgram;
let spaceball;
const uSlider = document.getElementById("uGranularity");
const vSlider = document.getElementById("vGranularity");

uSlider.addEventListener('input', updateSurface);
vSlider.addEventListener('input', updateSurface);

async function loadShader(gl, url, type) {
    const response = await fetch(url);
    const shaderSource = await response.text();

    const shader = gl.createShader(type);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`An error occurred compiling the shader: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

async function initShaders() {
    const vertexShader = await loadShader(gl, './shaders/vertex.glsl', gl.VERTEX_SHADER);
    const fragmentShader = await loadShader(gl, './shaders/fragment.glsl', gl.FRAGMENT_SHADER);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }

    gl.useProgram(shaderProgram);
    return new ShaderProgram('GouraudShader', shaderProgram, gl);
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    const modelView = spaceball.getViewMatrix();
    const rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    const translateToPointZero = m4.translation(0, 0, -10);

    const matAccum0 = m4.multiply(rotateToPointZero, modelView);
    const modelViewMatrix = m4.multiply(translateToPointZero, matAccum0);
    const normalMatrix = m4.inverse(m4.transpose(modelViewMatrix));

    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);
    
    gl.uniform3fv(shProgram.iLightPosition, [1.0, 1.0, 1.0]);
    gl.uniform3f(shProgram.iViewPosition, 0.0, 0.0, 5.0);
    gl.uniform3f(shProgram.iAmbientColor, 0.2, 0.2, 0.2);
    gl.uniform3f(shProgram.iDiffuseColor, 0.6, 0.6, 0.6);
    gl.uniform3f(shProgram.iSpecularColor, 1.0, 1.0, 1.0);
    gl.uniform1f(shProgram.iShininess, 32.0);
    surface.draw(gl, shProgram);
}


function updateSurface() {
    surface = new Model('Surface of Revolution of a Parabola of Arbitrary Position');
    surface.createSurfaceData(0.8, 1.25, 270, uSlider.value, vSlider.value);
    surface.bindBufferData(gl, shProgram);
    draw();
}

async function initGL() {
    shProgram = await initShaders();
    if (!shProgram) return;

    surface = new Model('Surface of Revolution of a Parabola of Arbitrary Position');

    surface.createSurfaceData(0.8, 1.25, 270, 72, 20);
    surface.bindBufferData(gl, shProgram);
    surface.bindTextures(gl, shProgram);

    gl.enable(gl.DEPTH_TEST);
    draw();
}

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    try {
        initGL();
        requestAnimationFrame(animateLight);
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);
}

function animateLight(time) {
    const radius = 10.0;
    const speed = 0.001;
    const x = radius * Math.cos(time * speed);
    const z = radius * Math.sin(time * speed);
    const y = 5.0;

    if (shProgram) {
        gl.uniform3f(shProgram.iLightDirection, x, y, z);
        if (surface) {
            surface.draw(gl, shProgram);
        }
    }
    requestAnimationFrame(animateLight);
}

init();
