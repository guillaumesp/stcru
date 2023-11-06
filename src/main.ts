import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import can from './assets/can.glb';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';

const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time)=>{
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)
// lenis.on('scroll', (e) => {
//   console.log(e)
// })

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}

requestAnimationFrame(raf)
gsap.registerPlugin(ScrollTrigger);


export default class App {
    private renderer: THREE.WebGLRenderer;
    private clock: THREE.Clock;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private canWrapperGroup: THREE.Group;
    private canGroup: THREE.Group;
    private canBody: THREE.Mesh|undefined;
    private canBody2: THREE.Mesh|undefined;
    private pointer: THREE.Vector2;
    private raycaster: THREE.Raycaster;
    private canGroupIsHovered: boolean;
    private orbitControls: OrbitControls|undefined;
    private canTextures: THREE.Texture[];

    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        document.querySelector('#renderer')!.appendChild(this.renderer.domElement);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.clock = new THREE.Clock();
        this.pointer = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.renderer.setAnimationLoop(() => this.animate());
        // handle resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });

        window.addEventListener( 'pointermove', e => this.onPointerMove(e) );
        window.addEventListener( 'click', e => this.onWindowClick(e) );
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 10);
        this.camera.rotation.set(0, 0, 0);

        this.scene = new THREE.Scene();

            //loading manager
        const loadingManager = new THREE.LoadingManager();
        const loader = new GLTFLoader(loadingManager);

        loader.load(can, (gltf) => {


            const canTextures = [
                this.getCanTexture('public/assets/221gigowatts.png'),
                this.getCanTexture('public/assets/feng-shui.png')
            ];
            
            this.canTextures = canTextures;


            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    // child.receiveShadow = true;
                }

                const baseCanBodyMaterial = new THREE.MeshStandardMaterial({
                    metalness: 1,
                    roughness: 0.5,
                    transparent: true,
                });

                if(child.name === 'CanBody') {
                    if (child instanceof THREE.Mesh) {
                       child.material = baseCanBodyMaterial;
                       child.material.map = canTextures[0];
                        this.canBody = child;
                    }
                   
                }

                if(child.name === 'CanBody2') {
                    if (child instanceof THREE.Mesh) {
                        child.material = baseCanBodyMaterial;
                        child.material.map = canTextures[1];
                        child.material.opacity = 0;
                        this.canBody2 = child;
                    }
                   
                }
   
            });

            const canGroup = new THREE.Group();
            canGroup.name = 'can';
            canGroup.add(gltf.scene);
            
            const canWrapperGroup = new THREE.Group();
            canWrapperGroup.name = 'canWrapper';
            canWrapperGroup.add(canGroup);

            // //axis helper
            // const axesHelper = new THREE.AxesHelper(5);
            // canWrapperGroup.add(axesHelper);

            this.canWrapperGroup = canWrapperGroup;
            this.canGroup = canGroup;
            this.canGroup.scale.set(1.9, 1.9, 1.9);
            this.scene.add(canWrapperGroup);

            this.addSceneLights();
            this.animateGsap();
            // this.addOrbitControls();

        });
        // scene
    }
    private getCanTexture(resource: string) {
        const texture1 = new THREE.TextureLoader().load(resource);

        texture1.flipY = false;
        texture1.colorSpace = THREE.SRGBColorSpace;

        return texture1;
    }

    onWindowClick(e: MouseEvent): any {
        if(this.canGroupIsHovered && this.canBody && this.canBody2) {
            const canBodyMaterial = this.canBody.material as THREE.MeshStandardMaterial;
            const canBodyMaterial2 = this.canBody2.material as THREE.MeshStandardMaterial;
            // if(this.canWrapperGroup.rotation.y == 0) {
            //     canBodyMaterial.map = this.canTextures[0];
            // } else {
            //     canBodyMaterial.map  = this.canTextures[1];
            
            // }

             if(this.canWrapperGroup.rotation.y == 0) {
                gsap.to(canBodyMaterial, {opacity: 0, duration: 1, ease: 'power2.inOut'});
                gsap.to(canBodyMaterial2, {opacity: 1, duration: 0.5, ease: 'power2.inOut'});

             } else {
                gsap.to(canBodyMaterial, {opacity: 1, duration: 0.5, ease: 'power2.inOut'});
                gsap.to(canBodyMaterial2, {opacity: 0, duration: 1, ease: 'power2.inOut'});
             }

            gsap.to(this.canWrapperGroup.rotation, {y: (this.canWrapperGroup.rotation.y == 0 ? Math.PI *2*2*-1 : 0), duration: 1, ease: 'power2.inOut'});

          
        }
    }
    animateGsap() {
        //scroll trigger
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '#section-1',
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
                markers: true,
            }
        });
        tl.to(this.canWrapperGroup.rotation, { x: Math.PI *2, y: Math.PI *2, duration: 1, ease: 'power2.inOut'})
        const item = document.querySelector('#section-2') as HTMLDivElement;
        tl.to(item, {
            scrollTrigger: {
              trigger: item,
              start: "top bottom",
              end: `+=${item.offsetHeight * 0} top`,
              scrub: 1,
              markers: true,
              onUpdate: (self) => self.next()?.refresh(),
              onLeave: () => ScrollTrigger.refresh(),
            },
            marginTop: `-${item.offsetHeight}`,
            ease: "power1.out"
          });
        
    }
    addOrbitControls() {
        //orbit controls
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        
    }
    onPointerMove(onPointerMove: PointerEvent) {
        this.pointer.x = ( onPointerMove.clientX / window.innerWidth ) * 2 - 1;
	    this.pointer.y = - ( onPointerMove.clientY / window.innerHeight ) * 2 + 1;
    }
    addSceneLights() {

        //ambient light

        // directional lights
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        // directionalLight.position.set(0, 2, 10);
        // this.scene.add(new THREE.DirectionalLightHelper(directionalLight, 1));
        // this.scene.add(directionalLight);
        // //point light
        // const pointLight1 = new THREE.PointLight(0xffffff);
        // pointLight1.position.set(-5, 2, 2);
        // pointLight1.decay = 20;
        // pointLight1.intensity = 1;
        // pointLight1.distance = 100;
        // this.scene.add(pointLight1);

        // const pointLight2 = new THREE.PointLight(0xffffff);
        // pointLight2.position.set(5, 2, 2);
        // pointLight2.decay = 20;
        // pointLight2.intensity = 1;
        // pointLight2.distance = 100;
        // this.scene.add(pointLight2);


        //spotlight
        const spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(-10, 7, 10);
        spotLight.angle = Math.PI / 10;
        spotLight.penumbra = 0.5;
        spotLight.decay = 45;
        spotLight.distance = 100;
        spotLight.castShadow = true;
        spotLight.intensity = 800;
  
        const spotLight2 = new THREE.SpotLight(0xffffff);
        spotLight2.position.set(10, 7, 10);
        spotLight2.angle = Math.PI / 10;
        spotLight2.penumbra = 0.5;
        spotLight2.decay = 45;
        spotLight2.distance = 100;
        spotLight2.castShadow = true;
        spotLight2.intensity = 800;

       
        // spotLight.shadow.mapSize.width = 1024;
        // spotLight.shadow.mapSize.height = 1024;
        // spotLight.shadow.camera.near = 10;
        // spotLight.shadow.camera.far = 100;
        this.scene.add(spotLight);
        this.scene.add(spotLight2);

        // this.camera.position.set(0, 2, 50);

    }
    animate(): void {
        this.raycaster.setFromCamera( this.pointer, this.camera );
        const time = this.clock.getElapsedTime();
        if(this.canGroup) {
            //levitate can
            
            this.canGroup.position.y = Math.sin(time) * 0.1 + 0.1;
            
            this.canGroup.rotation.y = Math.cos(time) * 0.2;
            this.canGroup.rotation.x = Math.cos(time) * 0.3;
            // this.canGroup.rotation.z = Math.cos(time) * 0.05;
            const intersects = this.raycaster.intersectObjects( this.canGroup.children );
            if(intersects.length > 0) {
                this.canGroupIsHovered = true;
            } else {
                this.canGroupIsHovered = false;
            }
        }
        this.orbitControls?.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new App();