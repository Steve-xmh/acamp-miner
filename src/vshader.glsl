#version 300 es
layout(location = 0) in vec3 pointPos;
out vec3 v_pointPos;
void main ()
{
    v_pointPos = pointPos;
    gl_PointSize = 1.0;
    gl_Position = vec4(pointPos.xy, 0.0, 1.0);
}
