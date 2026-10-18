import * as THREE from 'three';
import { generateSteveSkinTexture } from './textures';

export class PlayerAvatar {
  public group: THREE.Group;
  public id: string;
  public name: string;
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private heldItemMesh: THREE.Mesh | null = null;
  private nameTagSprite: THREE.Sprite;

  private walkPhase: number = 0;
  private swingProgress: number = 0;
  public targetPos: THREE.Vector3 = new THREE.Vector3();
  public targetYaw: number = 0;
  public targetPitch: number = 0;
  public isWalking: boolean = false;
  public isSwinging: boolean = false;

  constructor(id: string, name: string, skinType: 'steve' | 'alex' = 'steve') {
    this.id = id;
    this.name = name;
    this.group = new THREE.Group();

    const skinTex = generateSteveSkinTexture(skinType);
    const skinMaterial = new THREE.MeshLambertMaterial({
      map: skinTex,
    });

    // Dimensions (standard MC ratio: 1 block = 1 unit, player is ~1.8 units high)
    // 1. Torso: width 0.5, height 0.75, depth 0.25
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    this.torso = new THREE.Mesh(torsoGeo, skinMaterial);
    this.torso.position.y = 0.95;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // 2. Head: 0.5 x 0.5 x 0.5
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.head = new THREE.Mesh(headGeo, skinMaterial);
    this.head.position.y = 0.625; // on top of torso
    this.head.castShadow = true;
    this.torso.add(this.head);

    // 3. Right Arm: 0.25 x 0.75 x 0.25 (pivot at shoulder)
    const armGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    armGeo.translate(0, -0.3, 0); // pivot at shoulder top
    this.rightArm = new THREE.Mesh(armGeo, skinMaterial);
    this.rightArm.position.set(0.38, 0.35, 0);
    this.rightArm.castShadow = true;
    this.torso.add(this.rightArm);

    // 4. Left Arm
    this.leftArm = new THREE.Mesh(armGeo, skinMaterial);
    this.leftArm.position.set(-0.38, 0.35, 0);
    this.leftArm.castShadow = true;
    this.torso.add(this.leftArm);

    // 5. Right Leg: 0.25 x 0.75 x 0.25 (pivot at hip)
    const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    legGeo.translate(0, -0.35, 0); // pivot at hip
    this.rightLeg = new THREE.Mesh(legGeo, skinMaterial);
    this.rightLeg.position.set(0.13, -0.38, 0);
    this.rightLeg.castShadow = true;
    this.torso.add(this.rightLeg);

    // 6. Left Leg
    this.leftLeg = new THREE.Mesh(legGeo, skinMaterial);
    this.leftLeg.position.set(-0.13, -0.38, 0);
    this.leftLeg.castShadow = true;
    this.torso.add(this.leftLeg);

    // 7. Name Tag Billboard above head
    this.nameTagSprite = this.createNameTag(name);
    this.nameTagSprite.position.set(0, 1.95, 0);
    this.group.add(this.nameTagSprite);
  }

  private createNameTag(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Bedrock semi-transparent dark pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.roundRect(10, 8, 236, 48, 8);
    ctx.fill();

    // Name text
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.5, 0.38, 1);
    return sprite;
  }

  public setNameTagVisible(visible: boolean) {
    this.nameTagSprite.visible = visible;
  }

  public updateHeldItem(blockColor: string | null) {
    if (this.heldItemMesh) {
      this.rightArm.remove(this.heldItemMesh);
      this.heldItemMesh.geometry.dispose();
      this.heldItemMesh = null;
    }

    if (blockColor) {
      const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const mat = new THREE.MeshLambertMaterial({ color: blockColor });
      this.heldItemMesh = new THREE.Mesh(geo, mat);
      this.heldItemMesh.position.set(0, -0.5, 0.2);
      this.rightArm.add(this.heldItemMesh);
    }
  }

  public updateSkinTexture(tex: THREE.CanvasTexture) {
    this.torso.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshLambertMaterial) {
        obj.material.map = tex;
        obj.material.needsUpdate = true;
      }
    });
  }

  public setSneaking(sneaking: boolean) {
    this.torso.position.y = sneaking ? 0.78 : 0.95;
    this.torso.rotation.x = sneaking ? 0.35 : 0;
  }

  public triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  public update(dt: number) {
    // Smooth interpolation to target position
    this.group.position.lerp(this.targetPos, Math.min(dt * 15, 1));
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetYaw, Math.min(dt * 15, 1));
    this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, this.targetPitch, Math.min(dt * 15, 1));

    // Walking animation
    if (this.isWalking) {
      this.walkPhase += dt * 10;
      const angle = Math.sin(this.walkPhase) * 0.6;
      this.leftLeg.rotation.x = angle;
      this.rightLeg.rotation.x = -angle;
      this.leftArm.rotation.x = -angle;

      if (!this.isSwinging) {
        this.rightArm.rotation.x = angle;
      }
    } else {
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 10);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 10);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 10);
      if (!this.isSwinging) {
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, dt * 10);
      }
    }

    // Swinging punch / mining animation
    if (this.isSwinging) {
      this.swingProgress += dt * 5;
      if (this.swingProgress >= 1) {
        this.isSwinging = false;
        this.swingProgress = 0;
      } else {
        const swing = Math.sin(this.swingProgress * Math.PI);
        this.rightArm.rotation.x = -swing * 1.4;
        this.rightArm.rotation.y = -swing * 0.5;
      }
    }
  }

  public dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  }
}
