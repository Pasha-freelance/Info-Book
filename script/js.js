'use strict'
const searchInput = document.querySelector('#searchInput')
const searchButton = document.querySelector('#searchBut')
const booksBlock = document.querySelector('.books')
const preloader = document.querySelector('.preloader')
const myFavouritesButton = document.querySelector('#favBtn')
const favBooksBlock = document.querySelector('.favouriteBooks')
const accBlock = document.querySelector('.myAccountBlock')
const searchingBooksBlock = document.querySelector('.searchingBooksBlock')
const goBackToSearchBtn = document.querySelector('#goToSearchBtn')

let favouriteButtonsList = []
let amountOfFavourites = +localStorage.getItem('amountOfFavourites')
let maxFavId = +localStorage.getItem('maxFavId')
let previousInputVal = ''

//variables for counting books in the request
const amountOfBooksInRequest = 8;
let counter = amountOfBooksInRequest * 2;

//functions for hiding and showing preloader
function showPreloader() {
    preloader.classList.remove('preloader__hide')
    preloader.classList.add('preloader__show')
}

function hidePreloader() {
    preloader.classList.remove('preloader__show')
    preloader.classList.add('preloader__hide')
}

function addToFavourite() {  //adds book to the favourite

    let id = this.parentElement.parentElement.getAttribute('id')
    localStorage.setItem(`book${++amountOfFavourites}`, id)
    localStorage.setItem('amountOfFavourites', amountOfFavourites.toString())

    this.parentElement.parentElement.setAttribute('data-favId', `book${amountOfFavourites}`)
    this.setAttribute('title', 'Удалить из избранного')
    this.classList.remove('addToFavouritesBtn')
    this.classList.add('isFavouriteBtn')
    if (amountOfFavourites === 0) {
        maxFavId = 0
        localStorage.setItem('maxFavId', maxFavId.toString())
    }
    if (maxFavId < amountOfFavourites)
        localStorage.setItem('maxFavId', (++maxFavId).toString())
}

function removeFromFavourite() {    //removes book from the favourite
    let id = this.parentElement.parentElement.getAttribute('data-favId')
    localStorage.removeItem(`${id}`)
    this.parentElement.parentElement.removeAttribute('data-favId')
    this.setAttribute('title', 'Добавить в избранное')

    if (+amountOfFavourites > 0)
        localStorage.setItem('amountOfFavourites', (--amountOfFavourites).toString())

    this.classList.remove('isFavouriteBtn')
    this.classList.add('addToFavouritesBtn')
}

function listenerForFavBtn() {
    if (this.classList.contains('addToFavouritesBtn')) {
        addToFavourite.call(this)
    } else {
        removeFromFavourite.call(this)
    }
}


//updates the list of favourite buttons and sets eventListener for each of them for recording  data to the localStorage
function updateFavouriteButtons(where) {

    favouriteButtonsList = [...where.querySelectorAll('.addToFavouritesBtn'), ...where.querySelectorAll('.isFavouriteBtn')]

    favouriteButtonsList.forEach(item => {
        item.removeEventListener('click', listenerForFavBtn)
    })
    favouriteButtonsList.forEach(item => {
        item.addEventListener('click', listenerForFavBtn)
    })
}

//checks if book`s id is in the favourites
function isFavourite(id) {//returns index if true and false otherwise
    let tempId;
    for (let i = 1; i <= maxFavId; i++) {
        tempId = localStorage.getItem(`book${i}`)
        if (id === tempId) return i
    }
    return false
}

function addNewBook(book, where) {     //adds new book to the booksList
    //checking if some parameters are not null or undefined && cutting the description of the book
    let description
    if (book.volumeInfo.description) {
        if (book.volumeInfo.description.length >= 200) {
            description = [...book.volumeInfo.description.slice(0, 200)]
            description.push('...')
            description = description.join('')
        } else {
            description = book.volumeInfo.description
        }

    } else {
        description = ''
    }

    let author
    if (book.volumeInfo.authors) {
        author = book.volumeInfo.authors
    } else author = ''


    let imgSrc
    if (book.volumeInfo.imageLinks && book.volumeInfo.imageLinks.smallThumbnail) {
        imgSrc = book.volumeInfo.imageLinks.smallThumbnail
    } else imgSrc = ''

    where.insertAdjacentHTML('beforeend', `
            <div class="bookInfo" 
             id="${book.id}"
             data-favId="${isFavourite(book.id) !== false ? 'book' + isFavourite(book.id) : null}">
              <div class="rightCornerBg" >
                  <button 
                   class="${isFavourite(book.id) !== false ? 'isFavouriteBtn' : 'addToFavouritesBtn'}"
                   title="${isFavourite(book.id) !== false ? 'Удалить из избранного' : 'Добавить в избранное'}"  >
                   </button>
               </div>
                <h3 class="bookTitle">${book.volumeInfo.title}</h3>
                <h4 class="author">${author}</h4>
                <div class="bookDescription" style="opacity: ${description === '' ? 0 : 1}">${description}</div>
                <div class="bookPhoto"><img src="${imgSrc}" alt=""></div>
                <div class="buttonWrap saleBtnWrap"><a href="${book.volumeInfo.infoLink}" target ="_blank"><button class="commonBtn saleBtn" >Узнать больше!</button></a></div>
            </div>`)
}

function addBooksList(data) {         //adds booksList
    if (!data.items) {
        booksBlock.insertAdjacentHTML('beforeend', `<h6 class="endMsg noBooks">К сожалению у нас нет таких книг &#128533;</h6>`)
    } else {
        for (let i = 0; i < data.items.length; i++) {
            addNewBook(data.items[i], booksBlock)
        }
        updateFavouriteButtons(booksBlock)
        if (counter <= amountOfBooksInRequest * 5) {
            booksBlock.insertAdjacentHTML('beforeend', `<button class="moreBooksBtn commonBtn">Еще книги</button>`)
            document.querySelector('.moreBooksBtn').addEventListener('click', () => {
                requestForAddingBooks();
                document.querySelector('.moreBooksBtn').remove()
            })
        } else {
            booksBlock.insertAdjacentHTML('beforeend', `<h6 class="endMsg">К сожалению книги закончились &#128533;</h6>`)
        }
    }
}

function removeOldBooks(where) {         //removes all old notes including booksList, moreBooksBtn and endMsg
    let allBooks = where.querySelectorAll('.bookInfo')
    let moreBtn = where.querySelector('.moreBooksBtn')
    let endMsg = where.querySelector('.endMsg')
    if (allBooks)
        allBooks.forEach(item => {
            item.remove();
        })
    if (moreBtn) moreBtn.remove()
    if (endMsg) endMsg.remove()
}

function requestForAddingBooks() {      //makes request for getting more books
    let url = `https://www.googleapis.com/books/v1/volumes?q=${previousInputVal}&startIndex=${counter}&maxResults=${amountOfBooksInRequest}`
    counter += amountOfBooksInRequest + 1;

    preloader.classList.add('preloader__bottom__pos') //transmits preloader to the bottom of the page
    showPreloader()

    fetch(url)
        .then(response => {
            hidePreloader()
            preloader.classList.remove('preloader__bottom__pos')
            return response.json()
        })
        .then(response => {
            addBooksList(response)
        })
        .catch(error => console.error(error))
}

function firstRequest(inputValue) {           // makes request for getting books list with the value of main input (searchInput)
    if (inputValue !== '') {
        removeOldBooks(booksBlock)
        let url = `https://www.googleapis.com/books/v1/volumes?q=${inputValue}&maxResults=8`
        previousInputVal = inputValue
        showPreloader()
        fetch(url)
            .then(response => {
                hidePreloader()
                return response.json()
            })
            .then(response => {
                addBooksList(response)
                counter = amountOfBooksInRequest * 2
                searchInput.value = ''
            })
            .catch(error => console.error(error))
    }
}

searchButton.addEventListener('click', () => {
    firstRequest(searchInput.value)
})
searchInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 13) firstRequest(searchInput.value)
})

/**************************************************/
/***************Favourite books********************/

myFavouritesButton.addEventListener('click', () => {
    searchingBooksBlock.style.display = 'none'
    accBlock.style.display = 'block'
    goBackToSearchBtn.style.display = 'block'
    myFavouritesButton.style.display = 'none'
    if (amountOfFavourites !== 0) {
        let id, firstResponse = false
        showPreloader()
        for (let i = 1; i <= maxFavId; i++) {
            id = localStorage.getItem(`book${i}`)
            if (id !== null) {
                let url = `https://www.googleapis.com/books/v1/volumes/${id}?`
                fetch(url)
                    .then(response => {
                        if (!firstResponse) {
                            firstResponse = true
                            hidePreloader()
                        }
                        return response.json()
                    })
                    .then(response => {
                        addNewBook(response, favBooksBlock)
                        updateFavouriteButtons(favBooksBlock)
                    })
                    .catch(error => console.error(error))
            }
        }
    } else {
        favBooksBlock.insertAdjacentHTML('beforeend', `<h6 class="endMsg noBooks">К сожалению здесь ничего нет &#128533;</h6>`)
    }
})
goBackToSearchBtn.addEventListener('click', () => {
    searchingBooksBlock.style.display = 'block'
    accBlock.style.display = 'none'
    goBackToSearchBtn.style.display = 'none'
    myFavouritesButton.style.display = 'block'
    removeOldBooks(favBooksBlock)
    removeOldBooks(booksBlock)
    firstRequest(previousInputVal)
})

