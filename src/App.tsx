import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Viewer, Entity, Cesium3DTileset } from 'resium';
import { Cartesian3, HeadingPitchRange, ImageryLayer, UrlTemplateImageryProvider, defined, ScreenSpaceEventHandler,ScreenSpaceEventType, Math as CesiumMath, NearFarScalar, DistanceDisplayCondition, LabelStyle, VerticalOrigin, Cartesian2, Cartesian3 as CesiumCartesian3, Transforms, CameraEventType, Color } from 'cesium';
import './output.css';

// Predefined locations with coordinates typed as [number, number]
const locations: { name: string, coordinates: [number, number] }[] = [
  { name: "Lahaina Banyan Court Park", coordinates: [-156.6779217812668, 20.871660992482585] },
  { name: "Lahaina Historic District", coordinates: [-156.67665500607714, 20.875698021019634] },
  { name: "Lahaina Jodo Mission", coordinates: [-156.68738910041318, 20.882715610556918] },
  { name: "Kamehameha III School", coordinates: [-156.67687099268292, 20.87048936379182] },
  { name: "Lahaina's Front Street", coordinates: [-156.67749607658604, 20.872279930692464] },
  { name: "Ulalena at Maui Theatre", coordinates: [-156.6799569299401, 20.876752716785354] },
];

// Donation links with images and descriptions
const donationLinks = [
  { 
    name: "Hawaii Community Foundation", 
    url: "https://www.hawaiicommunityfoundation.org/maui-strong", 
    image: "images/donateImages/hawaii-community-foundation.jpg",
    description: "Supporting long-term recovery efforts for Maui communities"
  },
  { 
    name: "American Red Cross", 
    url: "https://www.redcross.org/donate/donation.html/", 
    image: "images/donateImages/maui-food-bank-wide.jpg",
    description: "Providing emergency shelter, supplies, and support for affected families"
  },
  { 
    name: "Maui Food Bank", 
    url: "https://mauifoodbank.org/donate/", 
    image: "/placeholder.svg?height=200&width=300",
    description: "Distributing food to those impacted by the wildfires"
  },
  { 
    name: "Maui Humane Society", 
    url: "https://www.mauihumanesociety.org/donate/", 
    image: "/placeholder.svg?height=200&width=300",
    description: "Caring for and reuniting pets displaced by the disaster"
  },
];

// Background images for the cover
const backgroundImages = [
  "images/backgroundImages/one.jpg",
  "images/backgroundImages/two.jpg",
  "images/backgroundImages/three.jpg",
];

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [viewer, setViewer] = useState<any>(null);
  const [unsubscribe, setUnsubscribe] = useState<any>(null);
  const [imageryLayer, setImageryLayer] = useState<ImageryLayer | null>(null);

  const pointCameraAt = (location: [number, number], elevation: number = 10) => {
    const center = Cartesian3.fromDegrees(location[0], location[1], elevation);
    const distance = 100; // Adjust this to control how far the camera should be

    const transform = Transforms.eastNorthUpToFixedFrame(center);

    viewer.scene.camera.lookAtTransform(
      transform,
      new HeadingPitchRange(0, -Math.PI / 8, distance)
    );
  };

  // Function to rotate the camera around a specific location and elevation
  const rotateCameraAround = (location: [number, number], elevation: number = 10) => {
    if (unsubscribe) unsubscribe(); // Stop any previous rotations

    pointCameraAt(location, elevation); // Point the camera at the location

    const rotationHandler = viewer.clock.onTick.addEventListener(() => {
      viewer.camera.rotate(CesiumCartesian3.UNIT_Z, 0.002); // Adjust rotation speed
    });

    // Store the unsubscribe function to stop rotation later
    setUnsubscribe(() => () => rotationHandler());
  };


  useEffect(() => {
    if (viewer && selectedLocation) {
      const [lng, lat] = selectedLocation;

      // viewer.scene.screenSpaceCameraController.enableRotate = false;
      // viewer.scene.screenSpaceCameraController.enableZoom = false;
      // viewer.scene.screenSpaceCameraController.enableTranslate = false;
      // viewer.scene.screenSpaceCameraController.enableTilt = false;
      // viewer.scene.screenSpaceCameraController.enableLook = false;

      // flyAndRotateCamera([lng, lat], 100);
      rotateCameraAround([lng, lat], 30);
        
    }
  }, [selectedLocation, viewer]);


    // Initial camera setup over Hawaii
    useEffect(() => {
      if (viewer) {
        // Set the initial view slightly above the Hawaii region
       // -156.888275, 20.094098
       const canvas = viewer.scene.canvas;

        
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(-157.35410577367455, 20.072002180635586, 900000), // Adjust altitude and coordinates over Hawaii
          orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-85.0),
            roll: 0.0,
          },
        });

      // Disable all user interactions initially
      // viewer.scene.screenSpaceCameraController.enableRotate = false;
      // viewer.scene.screenSpaceCameraController.enableZoom = false;
      // viewer.scene.screenSpaceCameraController.enableTranslate = false;
      // viewer.scene.screenSpaceCameraController.enableTilt = false;
      // viewer.scene.screenSpaceCameraController.enableLook = false;


      }
    }, [viewer]);

      // Show 2D tiles when holding the button down
  const show2DTiles = () => {
    console.log('pressed');
    if (viewer) {
      // Add the imagery layer
      const provider = new UrlTemplateImageryProvider({
        url: `https://tile.googleapis.com/v1/3dtiles/root.json?key=${process.env.REACT_APP_GMAP_API_KEY}`,
      });

      const layer = viewer.scene.imageryLayers.addImageryProvider(provider);
      setImageryLayer(layer);
    }
  };

    // Hide 2D tiles and revert to 3D when the button is released
    const hide2DTiles = () => {
      if (viewer && imageryLayer) {
        viewer.scene.imageryLayers.remove(imageryLayer);
        setImageryLayer(null);
      }
    };

    useEffect(() => {
      const intervalId = setInterval(() => {
        setCurrentBackgroundIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
      }, 5000); // Change image every 5 seconds
  
      return () => clearInterval(intervalId);
    }, []);


//     const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
// handler.setInputAction(function (click: ScreenSpaceEventHandler.PositionedEvent) {
//   const pickedObject = viewer.scene.pick(click.position);
  
//   // Check if the picked object is defined and if you want to ignore it
//   if (defined(pickedObject) && pickedObject.id && pickedObject.id.ignoreClicks) {
//     return; // Ignore clicks on this entity
//   }

//   // Handle click for other entities if needed
// }, ScreenSpaceEventType.LEFT_CLICK);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cover Page with Cycling Background */}
      <section 
        className="h-screen bg-cover bg-center flex items-center justify-center relative"
        style={{backgroundImage: `url(${backgroundImages[currentBackgroundIndex]})`}}
      > 
        {/* Dark Overlay */}
         <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="text-center text-white relative z-10">
          <h1 className="text-6xl font-bold mb-4">Lahaina Fires: Before and After</h1>
          <p className="text-2xl">Witness the impact and support the recovery</p>
        </div>
      </section>


      {/* Information Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-8 text-center">The Lahaina Fires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4">The Devastation</h3>
              <p className="text-gray-700">
                In August 2023, the historic town of Lahaina on Maui, Hawaii, was devastated by wildfires. 
                The fires, fueled by dry conditions and strong winds, destroyed over 2,000 structures and 
                displaced thousands of residents.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">The Impact</h3>
              <p className="text-gray-700">
                The fires have had a profound impact on the community, destroying homes, businesses, and 
                historic landmarks. The recovery process is ongoing, with efforts focused on rebuilding 
                and supporting those affected by this tragedy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cesium Map Section */}
      <section className="py-16 bg-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-8 text-center">Affected Areas</h2>
          <div className="relative" style={{ height: "600px" }}>
                 <Viewer
                 full
        baseLayer={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        animation={false}
        timeline={false}
        fullscreenButton={false}
        baseLayerPicker={false}
        homeButton={false}
        geocoder={false} // Disable search bar
        ref={(e) => {
          if (e && !viewer) {
            setViewer(e.cesiumElement); // Set the viewer instance
          }
        }}
      >

        {/* Load a 3D Tileset */}
        <Cesium3DTileset
          url={`https://tile.googleapis.com/v1/3dtiles/root.json?key=${process.env.REACT_APP_GMAP_API_KEY}`}
        />

      </Viewer>

            <div className="absolute top-4 left-4 bg-white bg-opacity-80 p-4 rounded-lg z-10">
              <h3 className="text-xl font-semibold mb-2">Affected Locations</h3>
              <ul>
                {locations.map((location, index) => (
                  <li 
                    key={index} 
                    className="cursor-pointer text-blue-600 hover:text-blue-800"
                    onClick={() => setSelectedLocation(location.coordinates)}
                  >
                    {location.name}
                  </li>
                ))}
              </ul>
                            {/* Button to toggle the 2D tiles */}
                <button
                className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
                onMouseDown={show2DTiles}
                onMouseUp={hide2DTiles}
                onMouseLeave={hide2DTiles}
              >
                Hold to Show 2D Tiles
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section with Images and Descriptions */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-8 text-center">Support the Recovery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {donationLinks.map((link, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img src={link.image} alt={link.name} className="w-full h-40 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{link.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{link.description}</p>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300 inline-block"
                  >
                    Donate Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}