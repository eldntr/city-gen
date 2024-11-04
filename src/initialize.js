import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

// Menyimpan status tombol untuk pergerakan kamera
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// Kecepatan gerakan kamera
const moveSpeed = 0.1;

function initialize() {
    $.container = document.getElementById($.config.container);
    $.containerSize.x = container.clientWidth;
    $.containerSize.y = container.clientHeight;

    $.scene = new THREE.Scene();
    $.scene.background = new THREE.Color($.config.color_background);

    $.camera = new THREE.PerspectiveCamera(
        25,
        $.containerSize.x / $.containerSize.y,
        0.1,
        2000,
    );

    $.camera.position.set(0, 20, 20);
    $.camera.lookAt($.cameraLookStartPos);

    $.camera.layers.enable(0);
    $.camera.layers.enable(1);

    let light0 = new THREE.AmbientLight(0xffffff, 0.5);
    let light1 = new THREE.PointLight(0xffffff, 0.5);
    light1.position.set(500, 1000, 500);
    light1.castShadow = true;

    $.scene.add(light0);
    $.scene.add(light1);

    $.renderer = new THREE.WebGLRenderer({ antialias: true });
    $.renderer.setPixelRatio(window.devicePixelRatio);
    $.renderer.setSize($.containerSize.x, $.containerSize.y);
    $.renderer.shadowMap.enabled = true;
    $.renderer.shadowMap.type = THREE.BasicShadowMap;
    container.appendChild($.renderer.domElement);

    window.addEventListener("resize", resize, false);

    // Initialize Orbit Controls
    $.controls = new MapControls($.camera, $.renderer.domElement);
    $.controls.enableDamping = true;
    $.controls.dampingFactor = 0.25;
    $.controls.screenSpacePanning = false;
    $.controls.maxDistance = 800;

    if ($.config.debug === true) {
        const axesHelper = new THREE.AxesHelper(5);
        $.scene.add(axesHelper);

        $.stats = new Stats();
        container.appendChild($.stats.dom);
    }

    // Event listener untuk input WASD
    window.addEventListener("keydown", onKeyDown, false);
    window.addEventListener("keyup", onKeyUp, false);
}

function resize() {
    $.container = document.getElementById($.config.container);
    $.containerSize.x = container.clientWidth;
    $.containerSize.y = container.clientHeight;

    $.camera.aspect = $.containerSize.x / $.containerSize.y;
    $.camera.updateProjectionMatrix();
    $.renderer.setSize($.containerSize.x, $.containerSize.y);
}

function animate() {
    requestAnimationFrame(animate);

    // Periksa status tombol dan gerakkan kamera
    if (keys.forward) {
        $.camera.translateZ(-moveSpeed);
    }
    if (keys.backward) {
        $.camera.translateZ(moveSpeed);
    }
    if (keys.left) {
        $.camera.translateX(-moveSpeed);
    }
    if (keys.right) {
        $.camera.translateX(moveSpeed);
    }

    // Perbarui kontrol orbit
    $.controls.update();

    $.renderer.render($.scene, $.camera);

    if ($.config.debug === true) {
        $.stats.update();
    }
}

// Fungsi untuk menangani event keydown
function onKeyDown(event) {
    switch (event.key) {
        case "w":
        case "W":
            keys.forward = true;
            break;
        case "s":
        case "S":
            keys.backward = true;
            break;
        case "a":
        case "A":
            keys.left = true;
            break;
        case "d":
        case "D":
            keys.right = true;
            break;
    }
}

// Fungsi untuk menangani event keyup
function onKeyUp(event) {
    switch (event.key) {
        case "w":
        case "W":
            keys.forward = false;
            break;
        case "s":
        case "S":
            keys.backward = false;
            break;
        case "a":
        case "A":
            keys.left = false;
            break;
        case "d":
        case "D":
            keys.right = false;
            break;
    }
}

export { initialize, animate };