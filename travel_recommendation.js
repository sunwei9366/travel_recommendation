const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const searchStatus = document.querySelector("#search-status");
const searchResults = document.querySelector("#search-results");

let recommendationsPromise;

function getRecommendations() {
  if (!recommendationsPromise) {
    recommendationsPromise = fetch("travel_recommendation_api.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load recommendations (${response.status}).`);
        }
        return response.json();
      })
      .catch((error) => {
        recommendationsPromise = undefined;
        throw error;
      });
  }
  return recommendationsPromise;
}

function getDestinations(recommendations) {
  const destinations = [];

  for (const country of recommendations.countries ?? []) {
    destinations.push({
      ...country,
      category: "Country",
      searchText: country.name,
    });

    for (const city of country.cities ?? []) {
      destinations.push({
        ...city,
        category: "City",
        searchText: `${country.name} ${city.name} ${city.description}`,
      });
    }
  }

  for (const temple of recommendations.temples ?? []) {
    destinations.push({ ...temple, category: "Temple" });
  }

  for (const beach of recommendations.beaches ?? []) {
    destinations.push({ ...beach, category: "Beach" });
  }

  return destinations;
}

function showResults(destinations) {
  searchResults.replaceChildren();

  for (const destination of destinations) {
    const article = document.createElement("article");
    article.className = "search-result";

    if (destination.imageUrl && !destination.imageUrl.startsWith("enter_your_image")) {
      const image = document.createElement("img");
      image.src = destination.imageUrl;
      image.alt = `View of ${destination.name}`;
      image.loading = "lazy";
      image.addEventListener("error", () => image.remove());
      article.append(image);

      if (destination.imageCredit && destination.imageCreditUrl) {
        const credit = document.createElement("a");
        credit.href = destination.imageCreditUrl;
        credit.target = "_blank";
        credit.rel = "noopener noreferrer";
        credit.textContent = destination.imageCredit;
        article.append(credit);
      }
    }

    const heading = document.createElement("h2");
    heading.textContent = destination.name;

    const category = document.createElement("p");
    category.textContent = destination.category;

    const description = document.createElement("p");
    description.textContent = destination.description;

    article.append(heading, category, description);
    searchResults.append(article);
  }
}

function normalizeSearchTerm(text) {
  return text
    .replace(/\bbeaches\b/g, "beach")
    .replace(/\bcountries\b/g, "country");
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim().toLocaleLowerCase();

  if (!query) {
    showResults([]);
    searchStatus.textContent = "Enter a destination or keyword to search.";
    searchInput.focus();
    return;
  }

  searchStatus.textContent = "Searching...";
  searchResults.replaceChildren();

  try {
    const recommendations = await getRecommendations();
    const normalizedQuery = normalizeSearchTerm(query);
    const matches = getDestinations(recommendations).filter((destination) => {
      const searchableText = `${destination.searchText ?? `${destination.name} ${destination.description}`} ${destination.category}`;
      const normalizedText = normalizeSearchTerm(searchableText.toLocaleLowerCase());
      return normalizedText.includes(normalizedQuery);
    });

    showResults(matches);
    searchStatus.textContent = matches.length
      ? `${matches.length} destination${matches.length === 1 ? "" : "s"} found.`
      : "No destinations found. Try another search.";
  } catch (error) {
    searchStatus.textContent = error.message;
  }
});

searchForm.addEventListener("reset", () => {
  showResults([]);
  searchStatus.textContent = "";
});