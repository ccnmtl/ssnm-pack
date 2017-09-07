Social Support Network Map: Standalone Interactive Exercise 
==========

#### Overview
Social Support mapping grows out of a long social work tradition of starting where a person is and recognizing strengths. It helps a person tap into and use his or her own natural support network to deal with challenging life issues. At a time when mental health interventions are increasingly complicated, it remains a simple and accessible, yet powerful tool to support individuals and families.

The Social Support Network Map is a tool to help students and mental health professionals create digital social support maps. This tool helps you create an image that shows important people in the life of you or your client, tag those people as negative, neutral or positive supports, and assign them support attributes. It will help guide a discussion of if, where and how to engage supports for help.

The Social Support Network Map was created in 2005 as a collaboration with Professor Susan Witte at the School of Social Work as an interactive learning tool for classroom instruction.


REQUIREMENTS
------------
npm
webpack

DEV INSTALLATION
------------
1. Clone the repository
2. Type make runserver. This command will install the necessary npm modules, build the bundle and spin up Webpack's dev server.
3. Navigate to http://localhost:8080.
4. Play around with the interactive!

NPM INSTALLATION
------------
1. npm install ssnm-pack
2. ./node_modules/webpack/webpack.js --output-path <output_path> --config ./node_modules/ssnm-pack/webpack.config.js
3. Embed the interactive via an iframe.

```
<code>
    <iframe src="<server>/<output_path>/index.html"></iframe>
</code>
```

#### Configuration
The interactive will alert the user on page navigation if the activity is not yet complete. To turn off this behavior, add a ```quiet=1``` parameter to the url. For example:

```
<code>
    <iframe src="<server>/<output_path>/?quiet=1"></iframe>
</code>
```