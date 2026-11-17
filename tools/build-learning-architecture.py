import bpy, math, os, sys, json
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'output','learning-film'); os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
try: scene.render.engine='BLENDER_EEVEE'
except TypeError: scene.render.engine='BLENDER_EEVEE_NEXT'
scene.render.resolution_x=1080; scene.render.resolution_y=1140; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.fps=12
scene.frame_start=1; scene.frame_end=288
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.85,.91,1,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.18
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.render.film_transparent=True

def mat(name,color,metal=0,rough=.4,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
white=mat('Porcelain aluminum',(.13,.18,.24),.8,.2)
edge=mat('Satin silver',(.35,.43,.53),.8,.2)
glass=mat('Smoky architectural glass',(.018,.047,.08),.6,.16)
lightglass=mat('Frosted blue glass',(.60,.76,.85),.3,.24)
ink=mat('Lettering',(1,1,1),0,.8,1.5)
labelmat=mat('Graphite name band',(.005,.012,.025),0,.9)
blue=mat('AI light',(.015,.39,1),.25,.2,3)
base=mat('White plinth',(.91,.93,.96),.15,.35)
ground=mat('Studio white',(.97,.975,.985),0,.7)
font=bpy.data.fonts.load('C:/Windows/Fonts/malgunbd.ttf')

def cube(name,loc,scale,material,parent=None,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(material)
 if bevel:
  m=o.modifiers.new('Machined edges','BEVEL');m.width=bevel;m.segments=2
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 if parent:o.parent=parent
 return o

def line(name,pts,r,material,parent=None):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3
 s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,co in zip(s.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);c.materials.append(material)
 if parent:o.parent=parent
 return o

def text(label,loc,size,parent=None):
 c=bpy.data.curves.new(label,'FONT');c.body=label;c.font=font;c.align_x='CENTER';c.align_y='CENTER';c.size=size;c.extrude=.001
 o=bpy.data.objects.new(label,c);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,0);c.materials.append(ink)
 if parent:o.parent=parent
 return o

def key(o,frame,loc=None,scale=None):
 if loc is not None:o.location=loc;o.keyframe_insert('location',frame=frame)
 if scale is not None:o.scale=scale;o.keyframe_insert('scale',frame=frame)

floor=cube('Ground',(0,0,-.28),(200,200,.2),ground,bevel=0)
floor.hide_render=True
cube('Architectural model base',(0,0,-.04),(7.8,3.8,.25),base,bevel=.12)
rows=[(7.2,2.05,['수학','비판적 사고','코딩']),(7.2,2.10,['구조역학','건축의 이해','데이터 분석']),(7.2,2.10,['건축설계','디지털모델링','건축환경']),(7.2,2.10,['현장 관찰','설계 실무','구조안전']),(2.4,2.25,['실무 프로젝트'])]
z=.18;modules=[];missing={(1,2):0,(2,0):1,(3,1):2}
for row,(width,height,names) in enumerate(rows):
 depth=2.65
 count=len(names);widths=[width/count]*count
 cursor=-width/2
 for col,(name,w) in enumerate(zip(names,widths)):
  x=cursor+w/2;cursor+=w
  parent=bpy.data.objects.new('Learning space - '+name,None);bpy.context.collection.objects.link(parent)
  # all child coordinates use the same world basis; parent is animated as an assembly.
  cube(name+' glass volume',(x,0,z+height/2),(w-.055,depth,height-.06),glass,parent,.035)
  cube('Roof slab',(x,0,z+height-.025),(w+.025,depth+.05,.045),white,parent,.018)
  cube('Floor slab',(x,0,z+.025),(w+.025,depth+.10,.075),white,parent,.018)
  # Individual architectural storeys and curtain-wall mullions.
  for j in range(1,9):
   zz=z+height*j/9
   cube('Floor edge',(x,-depth/2-.012,zz),(w-.02,.035,.018),edge,parent,.004)
   cube('Side floor edge',(x+w/2+.006,0,zz),(.023,depth,.018),edge,parent,.004)
  for j in range(max(2,int(w/.38))+1):
   xx=x-w/2+j*w/max(2,int(w/.38))
   cube('Facade mullion',(xx,-depth/2-.02,z+height/2),(.032,.045,height-.04),white,parent,.004)
  for yy in [-depth/2,0,depth/2]:cube('Side mullion',(x+w/2+.013,yy,z+height/2),(.025,.025,height-.03),edge,parent,.004)
  cube('Course nameplate',(x,-depth/2-.06,z+height*.52),(w-.12,.055,.69),labelmat,parent,.025)
  display=name.replace('실무 프로젝트','실무\n프로젝트').replace('디지털모델링','디지털\n모델링')
  text(display,(x,-depth/2-.10,z+height*.52),.38 if len(name)<6 else .34,parent)
  stripmat=mat('AI supports '+name,(.015,.4,1),.2,.22,0)
  strip=cube('AI learning trace',(x,-depth/2-.05,z+.07),(w-.10,.033,.025),stripmat,parent,.008)
  emission=stripmat.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength']
  for f,v in [(1,0),(60+row*5,0),(78+row*5,5),(110+row*5,1.5),(215,2.2),(288,2.2)]:emission.default_value=v;emission.keyframe_insert('default_value',frame=f)
  if (row,col) in missing:
   idx=missing[(row,col)];start=108+idx*31
   # Empty wireframe bay remains visible before AI-guided reconstruction.
   pts=[(x-w/2,-depth/2,z),(x+w/2,-depth/2,z),(x+w/2,-depth/2,z+height),(x-w/2,-depth/2,z+height),(x-w/2,-depth/2,z)]
   line('Missing knowledge frame',pts,.012,edge)
   key(parent,1,loc=(0,0,z),scale=(1,1,.001));key(parent,start,loc=(0,0,z),scale=(1,1,.001))
   # Scale from the bay floor, not the scene origin.
   key(parent,start+25,loc=(0,0,0),scale=(1,1,1))
  else:
   start=8+min(row,4-row)*18+col*2
   offset=-.8 if row<2 else .8 if row>2 else 0
   origin=(x*.999,0,(z+height/2)*.999+offset)
   key(parent,1,loc=origin,scale=(.001,.001,.001));key(parent,start,loc=origin,scale=(.001,.001,.001));key(parent,start+20,loc=(0,0,0),scale=(1,1,1))
  modules.append((name,row,x,z,height,depth))
 z+=height+.055
# Roof details turn the abstract learning stack into an architectural model.
cube('Tower crown',(0,0,z+.08),(2.48,2.72,.15),white)
for xx in [-.65,.65]:
 line('Twin antenna',[(xx,.3,z),(xx,.3,z+1.3)],.024,edge)
 cube('Antenna base',(xx,.3,z+.13),(.23,.23,.25),white)
# Soft studio lighting.
for name,loc,power,size in [('Key',(-5,-8,15),2200,7),('Fill',(6,-3,8),650,5),('Rim',(5,5,15),3000,5)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,4))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(11,-28,15.5));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,5.5))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=14.7;scene.camera=camera
scene.frame_set(230)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'learning-architecture.blend'))
exec(compile(open(os.path.join(ROOT,'tools','export-learning-lights.py'),encoding='utf-8-sig').read(),'export-learning-lights.py','exec'))
scene.render.filepath=os.path.join(OUT,'preview.png');bpy.ops.render.render(write_still=True)
print('PREVIEW_READY',flush=True)
if '--animate' in sys.argv:
 scene.render.filepath=os.path.join(OUT,'frames','frame_');os.makedirs(os.path.dirname(scene.render.filepath),exist_ok=True)
 for f in range(1,231):
  scene.frame_set(f);scene.render.filepath=os.path.join(OUT,'frames',f'frame_{f:04d}.png');bpy.ops.render.render(write_still=True)
  print('FRAME_DONE',f,flush=True)
