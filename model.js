class Model {
    constructor(name) {
        this.name = name;
        this.vertices = [];
        this.uLines = [];
        this.vLines = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];
        this.tangents = [];
    }

    createSurfaceData() {
        this.uLines = this.CreateULines();
        this.vLines = this.CreateVLines();

        // Calculate normals and tangents
        const { tangents, normals } = this.calculateTangentsAndNormals();
        this.normals = normals;
        this.tangents = tangents.flat();

        // Generate texture coordinates
        this.generateTextureCoordinates();
    }

    CreateULines() {
        let lines = [];
        let n = 720; // Reduce from 720 to 360 for fewer segments
        let m = 50;  // Reduce from 100 to 50 for fewer points along each line
        let radius = 0.8; // Reduce radius to make the surface smaller
        let height = 2;  // Reduce height for a smaller overall height
        let frequency = 3; // Reduce frequency to simplify the surface

        for (let i = 0; i < n; i += 30) {  // Increase step from 60 to 30 to reduce the number of lines
            let theta = this.deg2rad(i);
            let line = [];
            for (let j = 0; j <= m; j++) {
                let t = j / m;
                let y = height * t;
                let r = radius * Math.sin(frequency * Math.PI * t);
                let x = r * Math.cos(theta);
                let z = r * Math.sin(theta);
                line.push([x, y, z]);
            }
            lines.push(line);
        }
        return lines;
    }

    CreateVLines() {
        let lines = [];
        let n = 720; // Reduce from 720 to 360 for fewer segments
        let m = 50;  // Reduce from 100 to 50 for fewer points along each line
        let radius = 0.8; // Reduce radius
        let height = 1.2;  // Reduce height
        let frequency = 4; // Reduce frequency

        for (let j = 0; j <= m; j += 5) {
            let line = [];
            let t = j / m;
            let y = height * t;
            let r = radius * Math.sin(frequency * Math.PI * t);
            for (let i = 0; i < n; i += 10) {  // Increase step from 10 to 20 for fewer lines
                let theta = this.deg2rad(i);
                let x = r * Math.cos(theta);
                let z = r * Math.sin(theta);
                line.push([x, y, z]);
            }
            lines.push(line);
        }
        return lines;
    }

    generateTextureCoordinates() {
        this.texCoords = [];
        const uSegments = this.uLines.length;
        const vSegments = this.vLines.length;

        for (let u = 0; u < uSegments; u++) {
            for (let v = 0; v < vSegments; v++) {
                const uCoord = u / (uSegments - 1);
                const vCoord = v / (vSegments - 1);
                this.texCoords.push(uCoord, vCoord);
            }
        }
    }

    calculateTangentsAndNormals() {
        const normals = [];
        const tangents = [];

        for (let i = 0; i < this.uLines.length; i++) {
            for (let j = 0; j < this.uLines[i].length; j++) {
                const current = this.uLines[i][j];

                // Calculate tangent using next point in u direction
                const nextU = i < this.uLines.length - 1 ?
                    this.uLines[i + 1][j] :
                    this.uLines[i][j];

                // Calculate bitangent using next point in v direction
                const nextV = j < this.uLines[i].length - 1 ?
                    this.uLines[i][j + 1] :
                    this.uLines[i][j];

                const tangentU = [
                    nextU[0] - current[0],
                    nextU[1] - current[1],
                    nextU[2] - current[2]
                ];

                const tangentV = [
                    nextV[0] - current[0],
                    nextV[1] - current[1],
                    nextV[2] - current[2]
                ];

                const normal = this.normalize(this.crossProduct(tangentU, tangentV));
                const normalizedTangentU = this.normalize(tangentU);

                tangents.push(normalizedTangentU);
                normals.push(normal);
            }
        }

        return { tangents, normals };
    }

    // ... rest of the Model class methods remain the same ...
    bindBufferData(gl, shProgram) {
        this.vertices = this.generateVertices();
        this.generateIndices();

        // Create and bind vertex buffer
        this.iVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flat()), gl.STATIC_DRAW);

        // Create and bind normal buffer
        this.iNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals.flat()), gl.STATIC_DRAW);

        // Create and bind index buffer
        this.iIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        // Create and bind texture coordinates buffer
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texCoords), gl.STATIC_DRAW);

        // Create and bind tangent buffer
        this.iTangentBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangents), gl.STATIC_DRAW);
    }

    draw(gl, shProgram) {
        // Bind vertex buffer and set attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribPosition);

        // Bind normal buffer and set attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        // Bind index buffer and draw elements
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

        // Bind texture coordinates buffer and set attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(shProgram.aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.aTexCoord);

        // Bind tangent buffer and set attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.vertexAttribPointer(shProgram.aTangent, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.aTangent);
    }

    generateVertices() {
        // Преобразуем структуру uLines в плоский массив координат
        const flatVertices = [];
        for (let i = 0; i < this.uLines.length; i++) {
            for (let j = 0; j < this.uLines[i].length; j++) {
                const vertex = this.uLines[i][j];
                flatVertices.push(vertex[0], vertex[1], vertex[2]);
            }
        }
        return flatVertices;
    }

    generateIndices() {
        this.indices = [];
        const uSegments = this.uLines.length;
        const vSegments = this.uLines[0].length;

        for (let u = 0; u < uSegments - 1; u++) {
            for (let v = 0; v < vSegments - 1; v++) {
                const topLeft = u * vSegments + v;
                const topRight = topLeft + 1;
                const bottomLeft = (u + 1) * vSegments + v;
                const bottomRight = bottomLeft + 1;

                // Add two triangles to form a quad
                this.indices.push(topLeft, bottomLeft, topRight);
                this.indices.push(bottomLeft, bottomRight, topRight);
            }
        }
    }

    crossProduct(u, v) {
        return [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
        ];
    }

    normalize(vec) {
        const length = Math.sqrt(vec[0]**2 + vec[1]**2 + vec[2]**2);
        return vec.map(coord => coord / length);
    }

    deg2rad(angle) {
        return angle * Math.PI / 180;
    }

    bindTextures(gl, shaderProgram) {
        // Loading textures for diffuse, specular, and normal maps
        this.loadTexture(gl, shaderProgram, 'diffuse', './shaders/download.jpeg', 0);
        this.loadTexture(gl, shaderProgram, 'specular', './shaders/specular.jpg', 1);
    }

    loadTexture(gl, shaderProgram, textureType, src, unit) {
        this[textureType + 'Texture'] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this[textureType + 'Texture']);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));
        gl.generateMipmap(gl.TEXTURE_2D);

        const textureImage = new Image();
        textureImage.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this[textureType + 'Texture']);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        textureImage.onerror = () => {
            console.error(`Failed to load ${textureType} texture`);
        };
        textureImage.src = src;

        gl.activeTexture(gl[`TEXTURE${unit}`]);
        gl.uniform1i(shaderProgram[`u${textureType.charAt(0).toUpperCase() + textureType.slice(1)}Texture`], unit);
    }
}

export { Model };