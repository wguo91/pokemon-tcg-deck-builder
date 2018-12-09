"use strict";
let tempData = {};
let tempCount = 0;
window.addEventListener("unload", () => {
  let savedDeck = localStorage.getItem("savedDeck");
  if (savedDeck) {
    // let deckStorage = JSON.parse(tempData.savedDeck);
    localStorage.setItem("savedDeck", JSON.stringify(tempData));

    // save count
    localStorage.setItem("cardCounter", tempCount.toString());
  }
});
document.addEventListener("DOMContentLoaded", () => {
  let savedDeck = localStorage.getItem("savedDeck");
  if (!savedDeck) {
    // first initialization of localStorage
    localStorage.setItem("savedDeck", JSON.stringify({}));
    localStorage.setItem("cardCounter", "0");
    tempCount = 0;
  } else {
    let deckView = document.getElementById("deck-view");
    let jsonDeck = JSON.parse(savedDeck);
    tempData = jsonDeck; // place into tempData for future editing purposes
    for (let cardImage in jsonDeck) {
      let doc = new DOMParser().parseFromString(jsonDeck[cardImage], "text/html");
      deckView.appendChild(doc.querySelector("figure"));
    }
    // fetch card count from local storage
    tempCount = localStorage.getItem("cardCounter");
  }
  let deckCounter = document.getElementById("deck-counter");
  deckCounter.dataset.counter = tempCount.toString();
  deckCounter.innerHTML = tempCount.toString();

  // for AJAX calls
  const USER_KEY = "a297f552f5409f003fa4edb6fe0f8419";
  let baseUrl = "https://api.pokemontcg.io/v1/";
  let baseUrlCard = "https://api.pokemontcg.io/v1/cards/";

  // construct api call
  function constructApiCall(baseUrl, searchTerm, requestType) {
    return baseUrl + requestType + "/?name=" + searchTerm;
  };

  // add event listener to remove cards from the deck view, this is independent
  document.getElementById("deck-view").addEventListener("click", (event) => {
    if (event.target.tagName === "IMG") {
      let cardImage = event.target.closest(".card-image");
      cardImage.remove();

      // delete from tempData to prevent from being added to localStorage on unload
      delete tempData[cardImage.id];
    }
  });

  // loads the first 100 cards in the default list
  function loadDefaultListOfCards() {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          constructCardList(JSON.parse(xhr.responseText).cards);
          // remove the overlay
          let loadOverlay = document.getElementById("load-overlay");
          fadeOutElement(loadOverlay);
        } else {
          console.error("failure: " + xhr.responseText);
        }
      }
    });
    xhr.open("GET", baseUrlCard);
    xhr.send();
  };

  function fadeOutElement(target) {
    let fadeEffect = setInterval(() => {
      if (!target.style.opacity) {
        target.style.opacity = 1;
      }
      if (target.style.opacity > 0) {
        target.style.opacity -= 0.2;
      } else {
        clearInterval(fadeEffect);
        target.style.display = "none";
      }
    }, 100);
  };

  /**
   * ORDER OF FUNCTIONS:
   * fetchCardDataById
   * refreshCardList
   * constructCardList
   * addToDeckView
   * determineOverlayColor
   */

  /**
   * makes an AJAX call to fetch card data based on the card id
   * @param card id
   */
  function fetchCardDataById(id) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", baseUrlCard + id);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText).card);
        } else {
          reject(xhr.statusText);
        }
      }
      xhr.onerror = () => reject(xhr.statusText);
      xhr.send();
    });
  };

 /**
  * refreshes the card list e.g. after a search query
  * @param cards, the list of cards to display in #pokemon-list
  */
 function refreshCardList(cards) {
   let pokemonList = document.getElementById("pokemon-list");
   while (pokemonList.lastChild) {
     // using lastChild is more efficient
     pokemonList.removeChild(pokemonList.lastChild);
   }
   constructCardList(cards);
 };

 /**
  * for each card in cards, we will render a DOM list element
  * @param cards, the list of cards to convert into DOM elements
  */
 function constructCardList(cards) {
   if (cards.length !== 0) {
     let ul = document.createElement("ul");
     cards.forEach(function(card) {
       // add the plus icon
       let image = document.createElement("img");
       image.src = "images/plus.png";
       image.alt = "Add " + card.name + " to current deck";
       let figure = document.createElement("figure");
       figure.appendChild(image);

       let info = card.name + " [" + card.set + "]"
       let para = document.createElement("p");
       para.appendChild(document.createTextNode(info));

       let li = document.createElement("li");
       li.id = card.id;
       li.appendChild(para);
       li.appendChild(figure);
       ul.appendChild(li);
     });

     // EVENT DELEGATION
     // display detailed information about a card when the user clicks on a list item
     ul.addEventListener("click", (event) => {
       // if the add button is clicked, we perform a different action
       let closestListItem = event.target.closest("#pokemon-list li");
       fetchCardDataById(closestListItem.id)
         .then(cardData => {
           if (event.target.tagName === "IMG") {
             addToDeckView(cardData);
           } else {
             loadModal(cardData);
           }
         })
         .catch(error => console.error("Failure to fetch card data with error=" + error));
     });
     document.getElementById("pokemon-list").appendChild(ul);
   } else {
     let ul = document.createElement("ul");
     let li = document.createElement("li");
     li.appendChild(document.createTextNode("No results found. Try a different search term?"));
     ul.appendChild(li);
     document.getElementById("pokemon-list").appendChild(ul);
   }
 };

 /**
  * render the specified card to the deck view as a DOM element, can only add up to
  * 60 cards
  * @param card, the card to render into the view
  */
 function addToDeckView(card) {
   if (document.getElementById("deck-counter").dataset.counter === 60) {
     console.error("Deck is at maximum capacity");
     // TODO: render error message here
   }
   let cardImage = createCardImage(card.imageUrl, card.name);
   cardImage.classList.add("deck-view-image");
   cardImage.id = "cardImage_" + new Date().getTime().toString();
   // determine overlay color
   let overlayColor = determineOverlayColor(card.types);

   // add an overlay
   let cardOverlay = document.createElement("div");
   cardOverlay.classList.add("card-overlay");
   cardOverlay.style.backgroundColor = overlayColor + "66";

   // overlay text
   let cardOverlayDetails = document.createElement("p");
   cardOverlayDetails.appendChild(document.createTextNode(card.name));
   cardOverlayDetails.style.backgroundColor = overlayColor;

   // add a removal button
   let image = document.createElement("img");
   image.src = "images/minus.png";
   image.alt = "Remove " + card.name + " from current deck";
   let figure = document.createElement("figure");
   let figCaption = document.createElement("figcaption");
   figCaption.appendChild(document.createTextNode("Remove"));

   // if non-Pokemon card, border and font should be black
   if (card.supertype.startsWith("P")) {
     cardOverlayDetails.style.color = "#FFFFFF";
     cardOverlay.style.border = "1px solid " + overlayColor;
     figCaption.style.color = "#FFFFFF";
   } else {
     cardOverlayDetails.style.color = "#000000";
     cardOverlay.style.border = "1px solid " + "#000000";
     figCaption.style.color = "#000000";
   }
   cardOverlay.appendChild(cardOverlayDetails);
   figure.appendChild(image);
   figure.appendChild(figCaption);
   cardOverlay.appendChild(figure);

   cardImage.appendChild(cardOverlay);
   let deckView = document.getElementById("deck-view");
   deckView.appendChild(cardImage);

   // saving card to tempData, which will be transferred to local storage on unload event
   tempData[cardImage.id] = cardImage.outerHTML;

   // update counter in tempData
   tempCount++;
   let countString = tempCount.toString();

   // update counter in view
   let deckCounter = document.getElementById("deck-counter");
   deckCounter.dataset.counter = countString;
   deckCounter.innerHTML = countString;
 };

 /**
  * based on the Pokemon type, determine the overlay color, default color is white
  * @param the types array
  */
 function determineOverlayColor(types) {
   // if pokemon, choose color based on type, otherwise return default color (white)
   if (types) {
     let type = types[0].toLowerCase();
     switch(type) {
       case "colorless":
         return "#AFA97A";
       case "darkness":
         return "#16325A";
       case "dragon":
         return "#C9AE26";
       case "fairy":
         return "#FF1697";
       case "fighting":
         return "#FF5B00";
       case "fire":
         return "#FF0200";
       case "grass":
         return "#5ECB1F";
       case "lightning":
         return "#FFED01";
       case "metal":
         return "#6F858D";
       case "psychic":
         return "#833B8B";
       case "water":
         return "#00A8EA";
       default:
         return "#FFFFFF";
     }
   }
   return "#FFFFFF";
 };

  // create HTML element for the card type
  function createCardTypeElement(typeName, typeValue) {
    let cardType = document.createElement("p");
    cardType.appendChild(document.createTextNode("Card Type: " + typeName + " (" + typeValue + ")"));
    return cardType;
  }

  /**
   * load the modal dialog for a certain card
   * @param card, the card to construct the modal dialog for
   */
  function loadModal(card) {
    let modalContainer = document.createElement("div");
    modalContainer.classList.add("modal-container");
    modalContainer.addEventListener("click", event => {
      // when the user clicks anywhere outside the modal, close the modal
      if (event.target === modalContainer) modalContainer.style.display = "none";
    });

    let modal = document.createElement("section");
    modal.id = "modal";

    // cardInfo encompasses the card-header card-details
    let cardInfo = document.createElement("div");
    cardInfo.id = "card-info";

    let cardDetails = document.createElement("section");
    cardDetails.id = "card-details";

    // create header
    let header = document.createElement("header");
    header.id = "card-header";
    let cardName = document.createElement("h1");
    cardName.appendChild(document.createTextNode(card.name));
    header.appendChild(cardName);

    // choose appropriate background image for modal
    if (card.types) {
      modal.style.backgroundImage = "url('images/" + card.types[0].toLowerCase() + ".png')";
    } else if (card.supertype.startsWith("T")) {
      modal.style.backgroundImage = "url('images/trainer.png')";
    } else if (card.supertype.startsWith("E") && card.subtype !== "Special") {
      let cardName = parseEnergyName(card.name);
      modal.style.backgroundImage = "url('images/" + cardName + ".png')";
    } else {
      // default is trainer background for now
      modal.style.backgroundImage = "url('images/trainer.png')";
    }
    modal.style.backgroundPosition = "center";
    modal.style.backgroundAttachment = "fixed";

    if (card.supertype.startsWith("P")) {
      // card type
      cardDetails.appendChild(createCardTypeElement("Pokemon", card.subtype));

      // pokemon type
      let pokemonType = document.createElement("p");
      pokemonType.appendChild(document.createTextNode("Pokemon Type: " + card.types[0]));
      cardDetails.appendChild(pokemonType);

      // pokemon number
      let pokedexNumber = document.createElement("p");
      pokedexNumber.appendChild(document.createTextNode("National Pokedex Number: #" + card.nationalPokedexNumber));
      cardDetails.appendChild(pokedexNumber);

      // hp
      let hp = document.createElement("p");
      hp.appendChild(document.createTextNode("HP: " + card.hp));
      cardDetails.appendChild(hp);

      // pokepower
      if (card.ability) {
        let pokePower = createAbilityElement(card.ability);
        cardDetails.append(pokePower);
      }
      // attacks
      let allAttackDetails = createAttackDetails(card);
      cardDetails.append(allAttackDetails);

      // retreat cost and weaknesses
      let otherDetails = createOtherDetails(card);
      cardDetails.append(otherDetails);
    } else if (card.supertype.startsWith("T")) {
      // card type
      cardDetails.append(createCardTypeElement("Trainer", card.subtype));
      // trainer text
      let trainerText = document.createElement("p");
      trainerText.appendChild(document.createTextNode(card.text));
      cardDetails.append(trainerText);
    } else if (card.supertype.startsWith("E")) {
      // card type
      cardDetails.append(createCardTypeElement("Energy", card.subtype));
    }
    cardInfo.appendChild(header);
    cardInfo.appendChild(cardDetails);

    // create the "cancel" button for the modal dialog
    let cancelImage = document.createElement("img");
    cancelImage.src = "images/cancel.png";
    cancelImage.alt = "Cancel button";
    cancelImage.id = "cancel-btn";

    // exit the modal on click
    cancelImage.addEventListener("click", (event) => {
      modalContainer.style.display = "none";
    });

    let cancelImageFigure = document.createElement("figure");
    cancelImageFigure.appendChild(cancelImage);
    modal.appendChild(cancelImageFigure);

    // place image first, then header, then details
    let cardImage = createCardImage(card.imageUrl, card.name);
    modal.appendChild(cardImage);
    modal.appendChild(cardInfo);
    modalContainer.appendChild(modal);

    document.body.appendChild(modalContainer);
  };

  function parseEnergyName(name) {
    let wordsInName = name.toLowerCase().split(" ");
    const pokemonTypes = ["colorless", "dark", "dragon", "fairy", "fighting", "fire", "grass", "lightning", "metal", "psychic", "water"];
    for (let i = 0; i < wordsInName.length; i++) {
      if (pokemonTypes.indexOf(wordsInName[i]) === -1) continue;
      return wordsInName[i];
    }
    return null;
  };

  // create HTML element for pokepower / pokebody
  function createAbilityElement(cardAbility) {
    let abilityDetails = document.createElement("section");
    abilityDetails.classList.add("ability-details");

    let abilityName = document.createElement("h4");
    let abilityPrefix = "PokéPower";
    if (cardAbility.type.indexOf("Power") !== -1) {
      abilityName.classList.add("pokepower");
    } else {
      abilityName.classList.add("pokebody");
      abilityPrefix = "PokéBody";
    }
    abilityName.appendChild(document.createTextNode(abilityPrefix + ": " + cardAbility.name));

    let abilityText = document.createElement("p");
    abilityText.appendChild(document.createTextNode(cardAbility.text));

    abilityDetails.appendChild(abilityName);
    abilityDetails.appendChild(abilityText)
    return abilityDetails;
  };

  function createAttackDetails(card) {
    let allAttackDetails = document.createElement("section");
    allAttackDetails.classList.add("all-attack-details");
    card.attacks.forEach((currentAttack) => {
      let figure = document.createElement("figure");
      let attackDetails = document.createElement("section");
      attackDetails.classList.add("attack-details");

      // the energy cost, attack name, and damage are in the attack header
      let attackHeader = document.createElement("section");
      attackHeader.classList.add("attack-header");

      // first append energy costs (if any), then append the attack details
      if (currentAttack.cost.length) {
        for (let i = 0; i < currentAttack.cost.length; i++) {
          let costImage = document.createElement("img");
          costImage.classList.add("energy-cost");
          // some Pokemon cards have "free" energy costs...
          if (currentAttack.cost[i] !== "Free") {
            costImage.src = "images/" + currentAttack.cost[i].toLowerCase() + "_energy.png";
            costImage.alt = currentAttack.cost[i].toLowerCase() + " energy icon";
            figure.appendChild(costImage);
          }
        }
        // append all energy icons
        if (figure.hasChildNodes()) {
          attackHeader.appendChild(figure);
        }
      }

      // attack name
      let attackName = document.createElement("h4");
      attackName.appendChild(document.createTextNode(currentAttack.name));
      attackHeader.appendChild(attackName);

      // an attack may not have damage
      if (currentAttack.damage !== "") {
        let damage = document.createElement("h4");
        damage.appendChild(document.createTextNode(currentAttack.damage));
        attackHeader.appendChild(damage);
      }

      let attackText = document.createElement("p");
      attackText.appendChild(document.createTextNode(currentAttack.text));

      attackDetails.appendChild(attackHeader);
      attackDetails.appendChild(attackText);
      allAttackDetails.appendChild(attackDetails);
    });
    return allAttackDetails;
  };

  function createOtherDetails(card) {
    let otherDetails = document.createElement("section");
    otherDetails.classList.add("other-details");
    if (card.weaknesses) {
      otherDetails.appendChild(createWeaknessOrResistance(card.weaknesses, "weakness"));
    }
    if (card.resistances) {
      otherDetails.appendChild(createWeaknessOrResistance(card.resistances, "resistance"));
    }
    if (card.retreatCost) {
      otherDetails.appendChild(createRetreatCost(card.retreatCost));
    }
    return otherDetails;
  };

  function createRetreatCost(retreatCost) {
    let retreatCostSection = document.createElement("section");
    retreatCostSection.classList.add("retreat-cost");
    // retreat cost images
    let retreatCostFigure = document.createElement("figure");
    retreatCost.forEach((energy) => {
      let costImage = document.createElement("img");
      costImage.classList.add("energy-cost-other-details");
      costImage.src = "images/" + energy.toLowerCase() + "_energy.png";
      costImage.alt = energy.toLowerCase() + " energy icon";
      retreatCostFigure.appendChild(costImage);
    });
    let retreatCostText = document.createElement("p");
    retreatCostText.appendChild(document.createTextNode("Retreat Cost: "));
    retreatCostSection.appendChild(retreatCostText);
    retreatCostSection.appendChild(retreatCostFigure);
    return retreatCostSection;
  };
  // detail is either "weakness" or "resistance"
  function createWeaknessOrResistance(data, detail) {
    let dataSection = document.createElement("section");
    dataSection.classList.add(detail);
    // weakness or resistance images
    let detailFigure = document.createElement("figure");
    detailFigure.classList.add("weakness-resistance-figure");

    let detailImage = document.createElement("img");
    detailImage.classList.add("energy-cost-other-details");
    detailImage.src = "images/" + data[0].type.toLowerCase() + "_energy.png";
    detailImage.alt = data[0].type + " energy icon";
    // caption
    let detailFigureCaption = document.createElement("figcaption");
    detailFigureCaption.appendChild(document.createTextNode(data[0].value));

    detailFigure.appendChild(detailImage);
    detailFigure.appendChild(detailFigureCaption);
    // weakness text
    let detailText = document.createElement("p");
    detailText.appendChild(document.createTextNode(detail + ":"));
    dataSection.appendChild(detailText);
    dataSection.appendChild(detailFigure);
    return dataSection;
  };

  function createCardImage(imageUrl, imageName) {
    let figure = document.createElement("figure");
    figure.classList.add("card-image");

    let img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Pokemon card image of " + imageName;
    figure.appendChild(img)
    return figure;
  }

  loadDefaultListOfCards();
  let form = document.getElementById("pokemon-form");
  form.addEventListener("submit", function(event) {
    event.preventDefault();
    let pokemonInput = document.getElementById("pokemon-input").value;
    let url = constructApiCall(baseUrl, pokemonInput, "cards");
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          let jsonObject = JSON.parse(xhr.responseText);
          refreshCardList(jsonObject.cards);
        } else {
          alert("Failure");
        }
      }
    });
    xhr.open("GET", url);
    xhr.setRequestHeader("user-key", USER_KEY);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send();
  });
});
