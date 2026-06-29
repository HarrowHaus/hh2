import { writeFileSync } from 'node:fs'
// Assemble a minimal TIC-80 .tic cart = one CODE chunk (type 5) of Lua source.
// Chunk header (4 bytes): b0=(bank<<5)|type, b1=size&0xff, b2=size>>8, b3=reserved.
const LUA = `-- title:  moth
-- author: moldmouth
-- desc:   keep the moth off the bulbs
-- script: lua

t=0
mx=120 my=68
score=0 dead=false
bulbs={}
function spawn()
 for i=1,3 do
  bulbs[i]={x=math.random(8,232),y=math.random(8,128),r=6}
 end
end
spawn()
function TIC()
 if dead then
  cls(0)
  print("BURNT OUT",92,60,2)
  print("score "..score,98,72,12)
  print("press Z",100,86,5)
  if btnp(4) then dead=false score=0 mx=120 my=68 spawn() end
  return
 end
 t=t+1
 score=score+1
 if btn(0) then my=my-1.4 end
 if btn(1) then my=my+1.4 end
 if btn(2) then mx=mx-1.4 end
 if btn(3) then mx=mx+1.4 end
 mx=math.max(4,math.min(232,mx))
 my=math.max(4,math.min(132,my))
 cls(0)
 -- drifting bulbs
 for i,b in ipairs(bulbs) do
  b.x=b.x+math.sin((t+i*40)/30)*0.7
  b.y=b.y+math.cos((t+i*55)/34)*0.5
  local fl=(math.sin(t/6+i)*1.5+10)
  circ(b.x,b.y,fl,4)
  circ(b.x,b.y,b.r,9)
  circb(b.x,b.y,b.r,2)
  if (mx-b.x)^2+(my-b.y)^2 < (b.r+3)^2 then dead=true end
 end
 -- moth
 local w=math.sin(t/3)*3
 circ(mx,my,2,12)
 line(mx,my,mx-4,my-w,13)
 line(mx,my,mx+4,my-w,13)
 line(mx,my,mx-4,my+w,13)
 line(mx,my,mx+4,my+w,13)
 print("score "..score,3,3,5)
end
`
const code = Buffer.from(LUA, 'binary')
const size = code.length
const header = Buffer.from([5 & 0x1f, size & 0xff, (size>>8)&0xff, 0])
const cart = Buffer.concat([header, code])
writeFileSync(process.argv[2], cart)
console.log('cart bytes', cart.length, 'code', size)
