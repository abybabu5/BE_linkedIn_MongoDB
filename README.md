/*
    LinkedIn Backend + Auth
    ---------------------------------------------------------------------------------------
    Implement both frontend and backend authorization.
    Publish everything on the cloud.
​
    SERVER SIDE:
    Install and configure passport to enable:
    - Register
    - Login (passport local strategy)
    - Refresh (passport jwt strategy)
    - Implement Authorization (*) for:
        - Profile
        - Experiences
        - Posts
        - Comments
​
    - [EXTRA] Facebook
​
    (*) You can only mess with your own stuff. ex.: Post by John can be only be modified by John
    // User wants to modify Post 12345
    // ==> find post 12345
    // if (post12345.user === req.user._id) ==> DO IT!
    // else 401
​
    CLIENT SIDE:
    Create a Register and Login page.
    Save and use the Token for accessing the APIs.
​
    [EXTRA] Login With Facebook
