precision highp float;

varying vec3 vColor;
varying vec2 vTexCoord;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vNormal;

uniform sampler2D uDiffuseTexture;
uniform sampler2D uSpecularTexture;
uniform sampler2D uNormalTexture;
uniform vec3 uLightDirection;

void main() {
    vec3 diffuseMap = texture2D(uDiffuseTexture, vTexCoord).rgb;
    vec3 specularMap = texture2D(uSpecularTexture, vTexCoord).rgb;
    vec3 normalMap = texture2D(uNormalTexture, vTexCoord).rgb;

    normalMap = normalize(normalMap * 2.0 - 1.0);
    mat3 TBN = mat3(vTangent, vBitangent, vNormal); 
    vec3 normal = normalize(TBN * normalMap);

    vec3 finalColor = diffuseMap + specularMap + normal;

    gl_FragColor = vec4(finalColor * vColor, 1.0);
}