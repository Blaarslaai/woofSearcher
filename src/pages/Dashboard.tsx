import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Alert from '../components/Alert';

type DogBreeds = {
  message: Record<string, string[]>;
  status: string;
};

type DogImageResponse = {
  message: string;
  status: string;
};

type DogBreedsCache = {
  timestamp: number;
  data: DogBreeds;
};

const DOG_BREEDS_CACHE_KEY = "dog_breeds_cache_v1";
const DOG_BREEDS_CACHE_TTL_MS = 1000 * 60 * 60;
const DOG_FAVORITE_CACHE_KEY = "dog_favorites_cache_v1";

export default function DashboardPage() {
  const [dogBreeds, setDogBreeds] = useState<DogBreeds>();
  const [currentDog, setCurrentDog] = useState("");
  const [dogImages, setDogImages] = useState<string[]>([]);
  const [isLoadingDogImages, setIsLoadingDogImages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredBreeds = dogBreeds
    ? Object.entries(dogBreeds.message).filter(([breed]) =>
        breed.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : [];

  useEffect(() => {
    async function getDogBreeds() {
      const cachedRaw = localStorage.getItem(DOG_BREEDS_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as DogBreedsCache;
          const isFresh = Date.now() - cached.timestamp < DOG_BREEDS_CACHE_TTL_MS;
          if (isFresh) {
            setDogBreeds(cached.data);
            return;
          }
        } catch {
          localStorage.removeItem(DOG_BREEDS_CACHE_KEY);
        }
      }

      try {
        const res = await fetch("https://dog.ceo/api/breeds/list/all");

        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Fetch failed");
        }

        const data = await res.json();
        setDogBreeds(data);
        localStorage.setItem(
          DOG_BREEDS_CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data } satisfies DogBreedsCache),
        );
      } catch (error) {
        console.error("Failed to fetch dog breeds", error);
      }
    }

    getDogBreeds();
  }, [])

  const getDogImages = async (breed: string) => {
    setIsLoadingDogImages(true);
    setCurrentDog(breed);

    try {
      const responses = await Promise.all(
        Array.from({ length: 3 }, () => fetch(`https://dog.ceo/api/breed/${breed}/images/random`)),
      );

      const images = await Promise.all(
        responses.map(async (res) => {
          if (!res.ok) {
            const message = await res.text();
            throw new Error(message || "Fetch failed");
          }
          const data = (await res.json()) as DogImageResponse;
          return data.message;
        }),
      );

      setDogImages(images);

      setAlertMessage("Successfully fetched images.");
      setAlertType('alert-info');
    } catch (error) {
      setDogImages([]);
      console.error("Failed to fetch dog images", error);

      setAlertMessage("Failed to fetch dog images.");
      setAlertType('alert-warning');
    } finally {
      setIsLoadingDogImages(false);
    }
  };

  const saveFavorite = async (breed: string, imageUrl: string) => {
    if (!imageUrl) return;

    const res = await fetch("/api/favourites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ breed, imageUrl }),
    });

    if (!res.ok) {
      const message = await res.text();

      setAlertMessage(message || "Failed to save favourite");
      setAlertType('alert-error');

      throw new Error(message || "Failed to save favourite");
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

    setAlertMessage("Successfully saved to favorites.");
    setAlertType('alert-success');
  };

  return (
    <main className='flex flex-col min-h-screen'>
      <Navbar />

      <div className='flex justify-center items-center'>
        <h1>Dog Breeds Dashboard</h1>
      </div>

      <div className='flex flex-row justify-center mt-10 p-10 gap-6'>
        <div className='flex-1'>
          <ul className="list bg-base-100 rounded-box shadow-md overflow-scroll h-[70vh]">
  
            <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">Dog Breeds</li>

            <label className="input p-4 pb-2 text-xs ml-4">
              <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </g>
              </svg>
              <input
                type="search"
                className="grow"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            {filteredBreeds.map(([breed]) => (
                <li className='list-row flex flex-row items-center gap-3' key={breed}>
                  <div className='font-medium capitalize cursor-pointer' onClick={() => { void getDogImages(breed); }}>{breed}</div>
                  <div className='ml-auto flex items-center'>
                    <button
                      className="btn btn-square btn-ghost"
                      onClick={() => saveFavorite(breed, dogImages[0])}
                      disabled={isLoadingDogImages || breed !== currentDog || dogImages.length === 0}
                    >
                      <FontAwesomeIcon icon={faHeart} size='sm' />
                    </button>
                  </div>
                </li>
            ))}
          
          </ul>
        </div>

        <div className='flex-2'>
          <div className='font-semibold capitalize mb-3'>{currentDog}</div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            {!isLoadingDogImages && dogImages.map((imageUrl) => (
              <img
                key={imageUrl}
                src={imageUrl}
                alt={currentDog}
                className='w-48 h-48 object-cover rounded-lg'
              />
            ))}
            {dogImages.length === 0 && !isLoadingDogImages &&
              <>
                <div className="skeleton h-50 w-50"></div>
                <div className="skeleton h-50 w-50"></div>
                <div className="skeleton h-50 w-50"></div>
                <h2>Please select a dog breed on the left.</h2>
              </>
            }
            {isLoadingDogImages &&
              <>
                <div className="skeleton h-50 w-50"></div>
                <div className="skeleton h-50 w-50"></div>
                <div className="skeleton h-50 w-50"></div>
              </>
            }
          </div>
        </div>
      </div>

      <div className='flex flex-col justify-center items-center absolute bottom-0 top-auto mb-10 w-full'>
        {showAlert && <Alert type={alertType} message={alertMessage} />}
      </div>
    </main>
  );
}
