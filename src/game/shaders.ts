import * as THREE from 'three';

export type ShaderProfile = 'vanilla' | 'bsl' | 'rtx' | 'nostalgia' | 'night_vision';
export type ShadowQuality = 'off' | 'low' | 'medium' | 'high' | 'ultra';
export type FogSetting = 'off' | 'far' | 'medium' | 'near';

export interface ShaderConfig {
  profile: ShaderProfile;
  brightness: number; // 0 (Moody) to 100 (Bright / Full)
  shadowQuality: ShadowQuality;
  exposure: number; // 0.6 to 1.8
  fog: FogSetting;
  sunFlare: boolean;
  renderDistance: number; // 2 to 6 chunks radius
}

export const DEFAULT_SHADER_CONFIG: ShaderConfig = {
  profile: 'bsl',
  brightness: 70,
  shadowQuality: 'high',
  exposure: 1.15,
  fog: 'medium',
  sunFlare: true,
  renderDistance: 3, // 3 chunks radius = 7x7 = 49 chunks loaded around player
};

export class ShaderManager {
  public config: ShaderConfig;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    dirLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
    initialConfig: Partial<ShaderConfig> = {}
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.dirLight = dirLight;
    this.hemiLight = hemiLight;
    this.config = { ...DEFAULT_SHADER_CONFIG, ...initialConfig };

    this.applySettings();
  }

  public setConfig(newConfig: Partial<ShaderConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.applySettings();
  }

  public setProfile(profile: ShaderProfile) {
    this.config.profile = profile;
    switch (profile) {
      case 'vanilla':
        this.config.brightness = 50;
        this.config.shadowQuality = 'medium';
        this.config.exposure = 1.0;
        this.config.fog = 'medium';
        this.config.sunFlare = false;
        break;
      case 'bsl':
        this.config.brightness = 75;
        this.config.shadowQuality = 'high';
        this.config.exposure = 1.25;
        this.config.fog = 'far';
        this.config.sunFlare = true;
        break;
      case 'rtx':
        this.config.brightness = 65;
        this.config.shadowQuality = 'ultra';
        this.config.exposure = 1.1;
        this.config.fog = 'far';
        this.config.sunFlare = true;
        break;
      case 'nostalgia':
        this.config.brightness = 85;
        this.config.shadowQuality = 'low';
        this.config.exposure = 1.35;
        this.config.fog = 'near';
        this.config.sunFlare = false;
        break;
      case 'night_vision':
        this.config.brightness = 100;
        this.config.shadowQuality = 'low';
        this.config.exposure = 1.5;
        this.config.fog = 'off';
        this.config.sunFlare = true;
        break;
    }
    this.applySettings();
  }

  public applySettings() {
    // 1. Tone Mapping & Exposure
    if (this.config.profile === 'rtx' || this.config.profile === 'bsl') {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    } else if (this.config.profile === 'night_vision') {
      this.renderer.toneMapping = THREE.ReinhardToneMapping;
    } else {
      this.renderer.toneMapping = THREE.LinearToneMapping;
    }

    const brightnessMultiplier = 0.5 + (this.config.brightness / 100) * 0.9;
    this.renderer.toneMappingExposure = this.config.exposure * brightnessMultiplier;

    // 2. Shadows
    if (this.config.shadowQuality === 'off') {
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.dirLight.castShadow = true;

      let mapSize = 1024;
      if (this.config.shadowQuality === 'low') mapSize = 512;
      else if (this.config.shadowQuality === 'medium') mapSize = 1024;
      else if (this.config.shadowQuality === 'high') mapSize = 2048;
      else if (this.config.shadowQuality === 'ultra') mapSize = 2048;

      this.dirLight.shadow.mapSize.width = mapSize;
      this.dirLight.shadow.mapSize.height = mapSize;
      this.renderer.shadowMap.type =
        this.config.shadowQuality === 'ultra' || this.config.shadowQuality === 'high'
          ? THREE.PCFSoftShadowMap
          : THREE.BasicShadowMap;
    }

    // 3. Lighting Color Balance
    if (this.config.profile === 'bsl') {
      this.dirLight.color.set('#ffe8ba'); // Warm golden sun
      this.hemiLight.color.set('#a0d2ff'); // Sky fill
      this.hemiLight.groundColor.set('#4a6828');
    } else if (this.config.profile === 'rtx') {
      this.dirLight.color.set('#fff2db'); // Ultra white-gold
      this.hemiLight.color.set('#7db7ff');
      this.hemiLight.groundColor.set('#364821');
    } else if (this.config.profile === 'nostalgia') {
      this.dirLight.color.set('#ffffff'); // Harsh direct light
      this.hemiLight.color.set('#ffffff');
      this.hemiLight.groundColor.set('#555555');
    } else if (this.config.profile === 'night_vision') {
      this.dirLight.color.set('#e0ffff');
      this.hemiLight.color.set('#b0ffff');
      this.hemiLight.groundColor.set('#669999');
    } else {
      // Vanilla
      this.dirLight.color.set('#fff5e6');
      this.hemiLight.color.set('#b1e1ff');
      this.hemiLight.groundColor.set('#3b5323');
    }

    // 4. Fog
    if (this.config.fog === 'off') {
      this.scene.fog = null;
    } else {
      let density = 0.015;
      if (this.config.fog === 'near') density = 0.026;
      else if (this.config.fog === 'medium') density = 0.016;
      else if (this.config.fog === 'far') density = 0.009;

      if (!this.scene.fog) {
        this.scene.fog = new THREE.FogExp2('#78a7ff', density);
      } else if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.density = density;
      }
    }
  }
}
