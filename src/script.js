import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Fonts
 */
const fontLoader = new FontLoader()
fontLoader.load('/fonts/gentilis_regular.typeface.json', (font) => {
	const textGeometry = new TextGeometry('Star Wars', {
		font: font,
		size: 0.5,
		height: 0.2,
		curveSegments: 4,
		bevelEnabled: true,
		bevelThickness: 0.03,
		bevelSize: 0.02,
		bevelOffset: 0,
		bevelSegments: 4,
	})

	const text = new THREE.Mesh(textGeometry, new THREE.MeshNormalMaterial())
	textGeometry.center()
	text.position.y = 0.5
	scene.add(text)
})

/**
 * Galaxy
 */
const parameters = {}
parameters.count = 100000
parameters.size = 0.01
parameters.radius = 5
parameters.branches = 7
parameters.spin = 1.5
parameters.randomness = 0.2
parameters.randomnessPower = 3
parameters.insideColor = '#ff6030'
parameters.outsideColor = '#1b3984'

let geometry, material, points

const generateGalaxy = () => {
	// Destroy old galaxy
	if (points) {
		geometry.dispose()
		material.dispose()
		scene.remove(points)
	}
	geometry = new THREE.BufferGeometry()

	// Randomize the position
	const positions = new Float32Array(parameters.count * 3)
	const colors = new Float32Array(parameters.count * 3)

	const insideColor = new THREE.Color(parameters.insideColor)
	const outsideColor = new THREE.Color(parameters.outsideColor)

	for (let i = 0; i < parameters.count; i++) {
		const i3 = i * 3

		// Positions
		const radius = Math.random() * parameters.radius
		const spinAngle = radius * parameters.spin
		const branchAngle =
			((i % parameters.branches) / parameters.branches) * Math.PI * 2

		const getRandom = () =>
			Math.pow(Math.random(), parameters.randomnessPower) *
			parameters.randomness *
			(Math.random() < 0.5 ? 1 : -1)

		const randomX = getRandom()
		const randomY = getRandom()
		const randomZ = getRandom()

		// https://setosa.io/ev/sine-and-cosine/
		positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX // x
		positions[i3 + 1] = randomY // y
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ // z

		// Colors
		const mixedColor = insideColor.clone()
		const mixedRatio = radius / parameters.radius
		mixedColor.lerp(outsideColor, mixedRatio)

		colors[i3] = mixedColor.r // R
		colors[i3 + 1] = mixedColor.g // G
		colors[i3 + 2] = mixedColor.b // B
	}

	// Material
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
	material = new THREE.PointsMaterial()
	material.size = parameters.size
	material.sizeAttenuation = true
	material.transparent = true
	material.depthWrite = false
	material.blending = THREE.AdditiveBlending
	material.vertexColors = true

	// Add particles to the scene
	points = new THREE.Points(geometry, material)
	scene.add(points)
}
generateGalaxy()

// Tweaks
gui
	.add(parameters, 'count')
	.min(100)
	.max(1000000)
	.step(100)
	.onFinishChange(generateGalaxy)
gui
	.add(parameters, 'size')
	.min(0.001)
	.max(0.1)
	.step(0.001)
	.onFinishChange(generateGalaxy)
gui
	.add(parameters, 'radius')
	.min(0.01)
	.max(20)
	.step(0.01)
	.onFinishChange(generateGalaxy)
gui
	.add(parameters, 'branches')
	.min(2)
	.max(100)
	.step(1)
	.onFinishChange(generateGalaxy)
gui
	.add(parameters, 'spin')
	.min(-5)
	.max(5)
	.step(0.001)
	.onFinishChange(generateGalaxy)
gui
	.add(parameters, 'randomness')
	.min(0)
	.max(2)
	.step(0.001)
	.onFinishChange(generateGalaxy)
gui
	.add(parameters, 'randomnessPower')
	.min(1)
	.max(10)
	.step(0.01)
	.onFinishChange(generateGalaxy)
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	50,
	sizes.width / sizes.height,
	0.1,
	100
)
camera.position.x = 1
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
	const elapsedTime = clock.getElapsedTime()

	// Update controls
	controls.update()

	// Render
	renderer.render(scene, camera)

	// Call tick again on the next frame
	window.requestAnimationFrame(tick)
}

tick()
