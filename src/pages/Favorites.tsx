import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import Alert from '../components/Alert';

type DogFavorites = Record<string, string>;

type DogFavoritesCache = {
  timestamp: number;
  data: DogFavorites;
};

const DOG_FAVORITE_CACHE_KEY = "dog_favorites_cache_v1";
const DOG_FAVORITE_CACHE_TTL_MS = 1000 * 60 * 60;

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<DogFavorites>({});

  const [alertMessage, setAlertMessage] = useState("")
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<"alert-info" | "alert-warning" | "alert-error" | "alert-success">("alert-info");

  useEffect(() => {
    if (alertMessage == "") return;

    const timer = window.setTimeout(() => {
      setShowAlert(true);
      window.setTimeout(() => {
        setShowAlert(false);
        setAlertMessage("");
      }, 3000)
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [alertMessage]);

  useEffect(() => {
    async function getFavorites() {
      const cachedRaw = localStorage.getItem(DOG_FAVORITE_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as DogFavoritesCache;
          const isFresh = Date.now() - cached.timestamp < DOG_FAVORITE_CACHE_TTL_MS;
          if (isFresh) {
            setFavorites(cached.data);

            setAlertMessage("Successfully retrieved favorites.");
            setAlertType('alert-info');

            return;
          }
        } catch {
          localStorage.removeItem(DOG_FAVORITE_CACHE_KEY);
        }
      }

      try {
        const res = await fetch("/api/favourites");

        if (!res.ok) {
          const message = await res.text();

          setAlertMessage(message || "Fetch failed");
          setAlertType('alert-error');

          throw new Error(message || "Fetch failed");
        }

        const data = await res.json();
        setFavorites(data);
        localStorage.setItem(
          DOG_FAVORITE_CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data } satisfies DogFavoritesCache),
        );
      } catch (error) {
        console.error("Failed to fetch dog breeds", error);
      }
    }

    getFavorites();

    setAlertMessage("Successfully retrieved favorites.");
    setAlertType('alert-info');
  }, [])

  const deleteFavorite = async (breed: string, imageUrl: string) => {
    if (!imageUrl) return;

    const res = await fetch("/api/favourites", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ breed, imageUrl }),
    });

    if (!res.ok) {
      const message = await res.text();

      setAlertMessage(message || "Failed to delete favourite");
      setAlertType('alert-error');

      throw new Error(message || "Failed to delete favourite");
    }

    // Revalidate favourites cache immediately after saving.
    const favouritesRes = await fetch("/api/favourites");
    if (!favouritesRes.ok) {
      const message = await favouritesRes.text();

      setAlertMessage(message || "Failed to revalidate favourites cache");
      setAlertType('alert-error');

      throw new Error(message || "Failed to revalidate favourites cache");
    }

    const favouritesData = await favouritesRes.json();
    localStorage.setItem(
      DOG_FAVORITE_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data: favouritesData }),
    );

    setFavorites(favouritesData);

    setAlertMessage("Successfully removed from favorites.");
    setAlertType('alert-success');
  };

  return (
    <main className='flex flex-col min-h-screen'>
      <Navbar />

      <div className='flex justify-center items-center'>
        <h1>Favorite Dog Breeds</h1>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-6 justify-center mt-10 p-10 gap-6'>
        {Object.entries(favorites).map(([breed, imageUrl], index) => (
          <div key={index} className='flex flex-col justify-center items-center gap-2'>
            <div className='text-sm font-semibold capitalize'>{breed}</div>
            <img
              src={imageUrl}
              alt={`Favorite ${breed}`}
              className='w-48 h-48 object-cover rounded-lg'
            />
            <button
              className='btn btn-accent'
              onClick={() => deleteFavorite(breed, imageUrl)}
            >
              Remove <FontAwesomeIcon icon={faHeart} size='sm' />
            </button>
          </div>
        ))}
      </div>

      <div className='flex flex-col justify-center items-center absolute bottom-0 top-auto mb-10 w-full'>
        {showAlert && <Alert type={alertType} message={alertMessage} />}
      </div>
    </main>
  );
}
