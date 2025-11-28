import { useEffect, useRef } from 'react'
import { Engine, Scene, UniversalCamera, HemisphericLight, Vector3, MeshBuilder, ArcRotateCamera } from '@babylonjs/core'
import { GridMaterial } from '@babylonjs/materials'
import { useStore } from '@/store'

export default function ViewportPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const { scene, setScene, showGrid } = useStore()

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize Babylon.js engine
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    })
    engineRef.current = engine

    // Create scene
    const newScene = new Scene(engine)
    newScene.clearColor.set(0.1, 0.1, 0.1, 1)

    // Create camera
    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 4,
      10,
      Vector3.Zero(),
      newScene
    )
    camera.attachControl(canvasRef.current, true)
    camera.wheelDeltaPercentage = 0.1
    camera.minZ = 0.1
    camera.panningSensibility = 500

    // Create light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), newScene)
    light.intensity = 0.7

    // create cube
    const cube = MeshBuilder.CreateBox('cube', { size: 1 }, newScene)
    cube.position.y = 1

    // Create ground grid
    const ground = MeshBuilder.CreateGround('ground', { width: 1000, height: 1000 }, newScene)
    const gridMaterial = new GridMaterial('gridMaterial', newScene)
    gridMaterial.mainColor.set(0.3, 0.3, 0.3)
    gridMaterial.lineColor.set(0.1, 0.1, 0.1)
    gridMaterial.gridRatio = 1
    gridMaterial.majorUnitFrequency = 10
    gridMaterial.minorUnitVisibility = 0.45
    gridMaterial.opacity = 0.8
    ground.material = gridMaterial
    ground.isPickable = false
    ground.setEnabled(showGrid)

    // Store scene reference
    setScene(newScene)

    // Run render loop
    engine.runRenderLoop(() => {
      newScene.render()
    })

    // Handle resize
    const handleResize = () => {
      engine.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      newScene.dispose()
      engine.dispose()
    }
  }, [setScene, showGrid])

  // Update grid visibility
  useEffect(() => {
    if (!scene) return
    const ground = scene.getMeshByName('ground')
    if (ground) {
      ground.setEnabled(showGrid)
    }
  }, [scene, showGrid])

  return (
    <div className="w-full h-full bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full outline-none" />
    </div>
  )
}
