import * as THREE from 'three';

export class FoxCraftBlockLoader {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.smoothLighting = options.smoothLighting !== undefined ? options.smoothLighting : true;
        this.basePath = options.basePath || './assets/minecraft-1.21.8';
        this.blocksMap = new Map();
        this.texturesMap = new Map();
        this.materialsCache = new Map();
        this.textureLoader = new THREE.TextureLoader();
        this.textureLoader.setCrossOrigin('anonymous');
    }

    async loadDatabase() {
        try {
            console.log('[Bé Lôi Engine] 🎀 Đang nạp cơ sở dữ liệu Minecraft 1.21.8...');
            const res = await fetch(`${this.basePath}/blocks.json`);
            if (res.ok) {
                const blocksList = await res.json();
                blocksList.forEach(block => {
                    this.blocksMap.set(block.identifier, block);
                    this.blocksMap.set(block.name, block);
                    this.blocksMap.set(block.id, block);
                });
                console.log(`[Bé Lôi Engine] 🎀 Đã nạp thành công ${blocksList.length} khối Minecraft 1.21.8 chuẩn! Mya~`);
                return true;
            }
        } catch (err) {
            console.error('[Bé Lôi Engine] Lỗi nạp Database 1.21.8:', err);
        }
        return false;
    }

    getBlockMaterial(blockKey) {
        const block = this.blocksMap.get(blockKey);
        if (!block) return this._getFallbackMaterial('#888888');

        if (this.materialsCache.has(block.identifier)) {
            return this.materialsCache.get(block.identifier);
        }

        const tex = block.textures || {};
        const isSingle = typeof tex === 'string' || tex.all;

        let materials;
        if (isSingle) {
            const texName = typeof tex === 'string' ? tex : (tex.all || block.name);
            const texture = this._getTexture(texName, block);
            materials = new THREE.MeshLambertMaterial({
                map: texture,
                flatShading: !this.smoothLighting,
                transparent: !!block.transparent
            });
        } else {
            const matSide = this._createSingleMaterial(tex.side || block.name, block);
            const matTop = this._createSingleMaterial(tex.top || block.name, block);
            const matBottom = this._createSingleMaterial(tex.bottom || tex.top || block.name, block);
            materials = [matSide, matSide, matTop, matBottom, matSide, matSide];
        }

        this.materialsCache.set(block.identifier, materials);
        return materials;
    }

    createBlockMesh(blockKey, position = new THREE.Vector3(0, 0, 0)) {
        const block = this.blocksMap.get(blockKey);
        const materials = this.getBlockMaterial(blockKey);
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.copy(position);
        mesh.userData = {
            identifier: block ? block.identifier : blockKey,
            solid: block ? block.solid : true,
            hardness: block ? block.hardness : 1.5
        };
        return mesh;
    }

    _createSingleMaterial(texName, block) {
        const texture = this._getTexture(texName, block);
        return new THREE.MeshLambertMaterial({
            map: texture,
            flatShading: !this.smoothLighting,
            transparent: !!block.transparent
        });
    }

    _getTexture(texName, block) {
        if (this.texturesMap.has(texName)) {
            return this.texturesMap.get(texName);
        }

        const cdnImgPath = `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/master/assets/minecraft/textures/block/${texName}.png`;
        const canvas = this._createPixelCanvas(this._getSmartColor(block ? block.name : texName));
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        this.textureLoader.load(cdnImgPath, (cdnTex) => {
            cdnTex.magFilter = THREE.NearestFilter;
            cdnTex.colorSpace = THREE.SRGBColorSpace;
            texture.image = cdnTex.image;
            texture.needsUpdate = true;
        });

        this.texturesMap.set(texName, texture);
        return texture;
    }

    _getSmartColor(name = '') {
        const n = name.toLowerCase();
        if (n.includes('grass')) return '#4caf50';
        if (n.includes('dirt')) return '#5d4037';
        if (n.includes('stone')) return '#757575';
        if (n.includes('oak') || n.includes('log') || n.includes('plank')) return '#8d6e63';
        if (n.includes('cherry')) return '#ffb3c6';
        if (n.includes('amethyst')) return '#9b51e0';
        if (n.includes('dripstone')) return '#8d6e63';
        return '#888888';
    }

    _createPixelCanvas(colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, 32, 32);
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
            ctx.fillRect(Math.floor(Math.random() * 16) * 2, Math.floor(Math.random() * 16) * 2, 2, 2);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(0, 0, 32, 32);
        return canvas;
    }

    _getFallbackMaterial(colorHex) {
        const canvas = this._createPixelCanvas(colorHex);
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        return new THREE.MeshLambertMaterial({ map: tex });
    }
}
