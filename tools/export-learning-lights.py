import bpy,json,os
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
scene=bpy.context.scene
scene.frame_set(230)
def project(v):
 p=world_to_camera_view(scene,scene.camera,Vector(v));return [p.x*720,(1-p.y)*760]
bays={}
for o in bpy.data.objects:
 if o.name.startswith('Learning space - '):
  name=o.name.replace('Learning space - ','')
  front=next(c for c in o.children if c.name.startswith('Course nameplate'))
  center=front.location.copy();center.y-=.1
  # Bounding polygon follows each course space's facade, not screen-aligned boxes.
  glass=next(c for c in o.children if 'glass volume' in c.name)
  x,y,z=glass.location;w,d,h=glass.dimensions
  bays[name]={'center':project(center),'corners':[project((x-w/2,y-d/2-.1,z-h/2)),project((x+w/2,y-d/2-.1,z-h/2)),project((x+w/2,y-d/2-.1,z+h/2)),project((x-w/2,y-d/2-.1,z+h/2))]}
with open(os.path.join(os.path.dirname(bpy.data.filepath),'learning-bays.json'),'w',encoding='utf-8') as fp:json.dump(bays,fp,ensure_ascii=False)
