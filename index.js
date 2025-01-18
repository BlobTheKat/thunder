import { setGamma, cam, pointer, toBlockExact, entityMap, renderOptions } from 'world'
import { getblock } from 'ant'
import { drawLayer, preframe } from 'api'
import { Entities, Blocks } from 'definitions'
import { Module } from './module.js'
import 'https://unpkg.com/2keys@1.1.0/index.js'

console.log('\x1b[33;1mThunder\x1b[m beta 1.0')

Module('\\+bFullbright (L)', KEYS.L, () => {
	setGamma(new Array(16).fill(Infinity))
	renderOptions.lightUpdates = false
}, () => {
	setGamma(options.gamma)
	renderOptions.lightUpdates = true
})

let o = 0
Module('\\+7No distractions (K)', KEYS.K, () => {
	o = options.maxParticles; options.maxParticles = 0
	cam.nausea = NaN
}, () => {
	options.maxParticles = o; cam.nausea = 0
}, () => (cam.f = 0, world.weather = 0))

const placedBlocks = new Map2
const abg = Module('\\+9Autobridge (J)', KEYS.J)
drawLayer('world', -3000, (c, w, h) => {
	if(!abg.enabled || (me.state&1)) return
	let y = floor(me.y-.999), x = floor(me.x)
	if(getblock(x, y).solid){
		if(!me.dx) return
		x = floor(me.x+me.dx*.125)
	}
	if(getblock(x, y).solid) return
	for(let i = 0; i < 9; i++)
		if(me.inv[i]?.places?.()?.solid){
			me.selected = i
			pointer.lookAt(x+.5,y+.99)
			placedBlocks.set(x, y, t)
			pointer.click()
			break
		}
})
const blockPlaceCol = vec4(.75,.25,.25,.5)

let mv=0
Module('\\+eFreecam (H)', KEYS.H, null, () => {cam.x -= cam.baseX; cam.y -= cam.baseY; cam.baseX = cam.baseY = 0}, () => {
	cam.minZoom *= .25
	if(buttons.pop(KEYS.UP)) mv |= 1
	else if(changed.has(KEYS.UP)) mv &= ~1
	if(buttons.pop(KEYS.DOWN)) mv |= 2
	else if(changed.has(KEYS.DOWN)) mv &= ~2
	if(buttons.pop(KEYS.RIGHT)) mv |= 4
	else if(changed.has(KEYS.RIGHT)) mv &= ~4
	if(buttons.pop(KEYS.LEFT)) mv |= 8
	else if(changed.has(KEYS.LEFT)) mv &= ~8
	const dst = dt/cam.z*30
	if(mv&1) cam.baseY += dst, cam.y += dst
	if(mv&2) cam.baseY -= dst, cam.y -= dst
	if(mv&4) cam.baseX += dst, cam.x += dst
	if(mv&8) cam.baseX -= dst, cam.x -= dst
})

const esp = Module('\\+dEntityESP (G)', KEYS.G)
const espColPlayer = vec4(.5), espColLiving = vec4(.25,.75,.25,.5), espColOther = vec4(.25,.25,.75,.5)

const safe = Module('\\+aSafe (F)', KEYS.F, () => {
	Blocks.fire.solid = true
}, () => {
	Blocks.fire.solid = false
})
preframe.bind(() => {
	if(!safe.enabled) return
	const x = me.x + (me.dx > 0 ? -me.width + .0001 : me.width - .0001)
	const b1 = getblock(floor(x + me.dx * dt + sign(me.dx)*.125), floor(me.y - .001))
	if(me.impactDy < 0 && getblock(floor(x), floor(me.y - .001)).solid && ((!b1.solid && !getblock(floor(x + me.dx * dt + sign(me.dx)*.125), floor(me.y - 1.001)).solid) || (b1.className.startsWith('lava') && !jesus.enabled)))
		me.dx = 0
})

const jesus = Module('\\+cJesus (M)', KEYS.M, () => {
	const wat = Object.getPrototypeOf(Blocks.water), lav = Object.getPrototypeOf(Blocks.lava)
	wat.solid = lav.solid = true
	Blocks.waterTop.blockShape[3] = Blocks.lavaTop.blockShape[3] = 1
	for(let i = 1; i < 8; i++) Blocks['waterFlowing'+i].blockShape[3] = Blocks['lavaFlowing'+i].blockShape[3] += .125
}, () => {
	const wat = Object.getPrototypeOf(Blocks.water), lav = Object.getPrototypeOf(Blocks.lava)
	wat.solid = lav.solid = false
	Blocks.waterTop.blockShape[3] = Blocks.lavaTop.blockShape[3] = 7/8
	for(let i = 1; i < 8; i++) Blocks['waterFlowing'+i].blockShape[3] = Blocks['lavaFlowing'+i].blockShape[3] -= .125
})

const bread = Module('\\+1Breadcrumbs (B)', KEYS.B, null, () => breadTrail.length = 0)
let breadTrail = []
const breadCol = vec4(1,0,0,1)
let lastBread = 0
drawLayer('world', 999, (c, w, h) => {
	if(esp.enabled){
		const mex = ifloat(me.x + pointer.x - cam.x), mey = ifloat(me.y + me.head + pointer.y - cam.y)
		c.translate(mex, mey)
		for(const e of entityMap.values()){
			if(e == me) continue
			const c1 = c.sub()
			let x = ifloat(e.ix - cam.x) - mex, y = ifloat(e.iy + e.height/3 - cam.y) - mey
			c1.rotate(atan2(x, y))
			c1.drawRect(-0.02, -0.02, 0.04, hypot(x, y), e instanceof Entities.player ? espColPlayer : e.living ? espColLiving : espColOther)
		}
		c.translate(-mex, -mey)
	}
	const c1 = c.sub()
	for(const {0:x,1:y,2:time} of placedBlocks){
		const op = 1-(t-time)
		if(op<=0){ placedBlocks.delete(x,y);continue }
		toBlockExact(c1, x, y)
		c1.draw(blockPlaceCol.times(op))
	}
	if(bread.enabled){
		const len = breadTrail.length - 2
		const c1 = c.sub()
		c1.translate(-cam.x, -cam.y)
		for(let i = 0; i < len; i += 2){
			const x = breadTrail[i], y = breadTrail[i+1], w = breadTrail[i+2]-x, h = breadTrail[i+3]-y
			const ilen = .02/hypot(w, h)
			const w1 = -h*ilen, h1 = w*ilen
			c1.drawMat(w1*-2, h1*-2, w, h, x+w1, y+h1, breadCol)
		}
		add: if(t > lastBread+.05){
			const dx = me.x-breadTrail[len], dy = me.y-breadTrail[len+1]
			if(dx*dx+dy*dy<.01) break add
			breadTrail.push(me.x, me.y)
			lastBread = t
		}
	}
})