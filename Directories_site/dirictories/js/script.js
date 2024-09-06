document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    document.querySelector('input[name="search"]').addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        filterJobs(query);
    });
});

let allJobs = [];
const localhost = "https://back-end-nlic.netlify.app/.netlify/functions/api/";

function filterJobs(query) {
    const filteredJobs = allJobs.filter(job => job.name.toLowerCase().startsWith(query));
    updateTabs(filteredJobs);
}

async function fetchData() {
    const apiUrl = 'proxy';

    try {
        const response = await fetch(`${localhost}${apiUrl}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allJobs = data.documents;
        updateTabs(allJobs);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function updateTabs(jobs) {
    const jobTabs = document.getElementById('jobTabs');
    const tabContents = document.getElementById('tabContents');

    jobTabs.innerHTML = '';
    tabContents.innerHTML = '';

    jobs.forEach(job => {
        const button = document.createElement('button');
        button.className = 'tablinks';
        button.textContent = job.name;
        button.onclick = () => openJobs(null, job.name);
        jobTabs.appendChild(button);

        const contentDiv = document.createElement('div');
        contentDiv.id = job.name;
        contentDiv.className = 'tabcontent tabhidden';

        job.people.forEach(person => {
            const personDiv = document.createElement('div');
            personDiv.className = 'person';
            
            if (person.image && person.image.contentType && person.image.data) {
                const img = document.createElement('img');
                img.src = `data:${person.image.contentType};base64,${person.image.data}`;
                img.alt = person.name;
                img.className = 'person-image';
                img.onclick = () => {
                    showPersonDetails(person);
                };
                personDiv.appendChild(img);
            }

            const nameDiv = document.createElement('div');
            nameDiv.textContent = person.name;
            nameDiv.className = 'person-name';
            nameDiv.onclick = () => {
                showPersonDetails(person);
            };

            personDiv.appendChild(nameDiv);
            contentDiv.appendChild(personDiv);
        });
        tabContents.appendChild(contentDiv);
    });

    const defaultTab = document.querySelector('.tablinks');
    if (defaultTab) {
        defaultTab.click();
    }
}

function openJobs(evt, jobName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(jobName).style.display = "grid";
    if (evt) evt.currentTarget.className += " active";
}

function showPersonDetails(person) {
    const personDetails = document.getElementById('personDetails');
    const personImage = document.getElementById('personImage');

    if (person.image && person.image.contentType && person.image.data) {
        personImage.src = `data:${person.image.contentType};base64,${person.image.data}`;
    } else {
        personImage.src = '/img.jpg'; // Placeholder or default image
    }

    document.getElementById('personName').textContent = person.name;
    document.getElementById('personDescription').textContent = person.description || 'No description available';
    document.getElementById('personPhoneNumber').textContent = "Contact: " + (person.contactNumber || 'Not available');
    document.getElementById('personWorkLocation').textContent = "Work Location: " + (person.workLocation || 'Not available');

    personDetails.style.display = 'flex';

    window.currentPersonId = person._id;

    const commentsSection = document.getElementById('commentsSection');
    commentsSection.innerHTML = '';

    if (person.reviews && person.reviews.length > 0) {
        person.reviews.forEach(review => {
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review';
    
            const reviewContent = document.createElement('div');
            reviewContent.className = 'review-content';
    
            const reviewer = document.createElement('span');
            reviewer.className = 'reviewer';
            reviewer.textContent = 'Reviewer:';
    
            const reviewText = document.createElement('p');
            reviewText.className = 'comment';
            reviewText.textContent = review.review;
    
            const ratingDiv = document.createElement('div');
            ratingDiv.className = 'rating-stars';
            const rating = review.rating;
    
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.className = 'star';
                star.textContent = '★';
                if (i <= rating) {
                    star.style.color = '#ffc700';
                } else {
                    star.style.color = '#ccc';
                }
                ratingDiv.appendChild(star);
            }
    
            reviewContent.appendChild(reviewer);
            reviewContent.appendChild(reviewText);
            reviewDiv.appendChild(reviewContent);
            reviewDiv.appendChild(ratingDiv);
            commentsSection.appendChild(reviewDiv);
        });
    } else {
        commentsSection.innerHTML = '<p>No reviews available.</p>';
    }
}

function closePersonDetails() {
    const personDetails = document.getElementById('personDetails');
    personDetails.style.display = 'none';
}

function toggleReviewSection() {
    const reviewSection = document.getElementById('reviewSection');
    if (reviewSection.style.display === 'none' || reviewSection.style.display === '') {
        reviewSection.style.display = 'block';
    } else {
        reviewSection.style.display = 'none';
    }
}

async function submitReview() {
    const reviewInput = document.getElementById('reviewInput');
    const reviewText = reviewInput.value.trim();

    const submitUrl = "submit-review";

    const starRating = document.querySelector('input[name="rate"]:checked');

    const personId = window.currentPersonId;

    if (reviewText && starRating && personId) {
        try {
            const response = await fetch(localhost + submitUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personId: personId,
                    review: reviewText,
                    rating: starRating.value
                })
            });

            const data = await response.json();
            if (response.ok) {
                reviewInput.value = '';
                starRating.checked = false;
                console.log("Review Submitted!");

                fetchData();

                closePersonDetails();
            } else {
                console.error('Error submitting review:', data);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    } else {
        console.log('Please enter a review, select a star rating, and ensure person ID is set.');
    }
}
