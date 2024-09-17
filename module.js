
import { drawLayer, drawText, calcText, onkey, preframe } from 'api'
preframe.bind(() => {
	for(const f of onframes) f.ac&&f(f.ac)
}, 0)
drawLayer('ui', 3000, (c, w, h) => {
	c.translate(w-6, 2)
	for(const line of modules){
		if(!line) continue
		const m = calcText(line)
		drawText(c, m, m.width*-8, 2, 8)
		c.translate(0, 12)
	}
})
const onframes = [], modules = ['\\13Thunder\\0f beta 1.0']
export function Module(name, key, onactivate, ondeactivate, onframe){
	if(!ondeactivate) onframe = onactivate, onactivate = null
	let j = -1
	j = modules.push(null)-1
	let ac = 0
	if(onframe) onframes.push(onframe),onframe.ac = ac
	if(key) onkey(key, () => {
		if(ac = ac ? 0 : buttons.has(KEYS.SHIFT)+1) modules[j] = name, onactivate?.(ac)
		else modules[j] = null, ondeactivate?.()
		onframe&&(onframe.ac=ac)
	})
	return {get enabled(){return !!ac},name,key}
}