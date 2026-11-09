// IMPORTANT: the order matters!
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { ListingData } from '@/lib/elements';
import * as Leaflet from 'leaflet';
import { useLocation } from 'react-router';
import { useRepurposedStore } from '@/lib/store';
import repurposedIcon from '/assets/icons/repurposed_heart.svg';

type LocatedListing = ListingData & { location: NonNullable<ListingData['location']> };

const getCenter = (elements: LocatedListing[]) =>
  elements.reduce(
    (acc, element) => [
      acc[0] + element.location.lat / elements.length,
      acc[1] + element.location.lng / elements.length
    ],
    [0, 0]
  ) as [number, number];

export const Map: React.FC<{ elements: ListingData[]; className: string }> = ({ elements, className }) => {
  const located = elements.filter((e): e is LocatedListing => !!e.location);
  const { pathname } = useLocation();
  const setFocusedListingId = useRepurposedStore((s) => s.setFocusedListingId);

  if (located.length === 0) return null;

  const isAllElements = pathname.includes('all-elements');

  return (
    <MapContainer
      className={className}
      center={getCenter(located)}
      zoom={4}
      scrollWheelZoom={true}
      // attributionControl={false}
      zoomControl={false}
      whenReady={
        ((map: { target: Leaflet.Map }) =>
          Leaflet.control
            .zoom({
              position: 'bottomleft'
            })
            .addTo(map.target)) as any
      }
    >
      <TileLayer
        attribution='<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((element) => (
        <Marker
          icon={Leaflet.divIcon({
            html: `<img src="${repurposedIcon}" style="width:100%;height:100%" /></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            className: ''
          })}
          key={element._id}
          position={[element.location.lat, element.location.lng]}
          eventHandlers={
            isAllElements
              ? {
                  click: () => setFocusedListingId(element._id)
                }
              : undefined
          }
        />
      ))}
    </MapContainer>
  );
};

export default Map;
