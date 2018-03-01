---
layout: post
title:  "Faster Docker builds in Travis CI for R packages"
date:   2018-03-01
tag: R
---

The default support for R packages in Travis CI consists in basically three steps.
First, your package repository is cloned into the working directory in Travis's VM/container.
All package dependencies are first installed and finally the package can be built and checked.
If no errors were raised during this steps, your build is considered successful! Here is
an example of the default `.travis.yml` steps for R packages.

{% highlight yaml linenos %}
install:
 - R -e 'devtools::install_deps(dep = T)'

script:
 - R CMD build .
 - R CMD check *tar.gz

{% endhighlight %}

Pretty easy, huh? Now, imagine that your package is so cool and so full of features that
it deserves its own Docker image. How could we automate the Docker image build with Travis?
Considering you have a Dockerfile in the root of the package directory similar
to this:

{% highlight dockerfile linenos %}
FROM r-base:3.4.0

RUN apt-get update &&\
    apt-get install -y --no-install-recommends\
    libxml2-dev libcurl4-openssl-dev libssl-dev\
    libssh2-1-dev

ADD . /yourpackage

RUN Rscript -e "install.packages('devtools'); devtools::install()"
{% endhighlight %}

we could just add some more steps to the previous `.travis.yml` file

{% highlight yaml linenos %}
services:
 - docker

install:
 - R -e 'devtools::install_deps(dep = T)'

script:
 - R CMD build .
 - R CMD check *tar.gz

after_success:
 - docker image build -t coolname/mypackage . ;
 - docker login -u $MYUSER -p $MYPASS ;
 - docker push coolname/mypackage;
{% endhighlight %}

The new `after_success` block has an intuitive name. Those docker commands inside this block will
only run if the build and check steps are **successful**. We don't want to publish
a Docker image with the broken code, right?

This approach would work pretty well for packages with few dependencies, but would be a bad choice
for packages with lots of dependencies. And why is that? 

![Alt Text](https://media.giphy.com/media/s239QJIh56sRW/giphy.gif){: .center-image}

If you understood everything until now you probably noticed we are installing the package dependencies **twice**: 
one inside the VM for the check and build steps and another during the Docker image build. Well, we need optimize
this! To achieve this we'll need two Dockerfiles: one for an intermediate image and one for the final package
image that will be published to Docker Hub. Let's name the former `Dockerfile.build` and the latter `Dockerfile`.

In the intermediate image we will install all the package dependencies. This image will be used to run the build
and check **inside** a Docker container. The `Dockerfile.build` file should look like this:

{% highlight dockerfile linenos %}
FROM r-base:3.4.0

# here we install some systems dependencies
RUN apt-get update &&\
    apt-get install -y --no-install-recommends libssl-dev\
    libssh2-1-dev libcurl4-openssl-dev pandoc libxml2-dev

ADD . /yourpackage

WORKDIR /yourpackage

# here we install some other dependencies
RUN Rscript -e "install.packages('devtools'); devtools::install_deps(dep=T)"
{% endhighlight %}

So, instead of installing the dependencies inside the Travis VM, we add them
to the intermediate docker image, that we will tag as **:builder**. The `install` and
`script` steps will now run with Docker commands.

{% highlight yaml linenos %}
services:
 - docker

install:
 - docker image build -t coolname/yourpackage:builder -f Dockerfile.build .

script:
 - docker container run --rm coolname/yourpackage:builder bash -c "R CMD build . && R CMD check --no-manual --no-build-vignettes --no-examples *tar.gz"
{% endhighlight %}

Basically, we built an intermediate image called _**coolname/yourpackage:builder**_ and created an
ephemeral container that executed the build and check steps for us before getting destroyed.
Finally, we want to build the official image and push it to the registry, in case of success. 
Here is an example of how the `Dockerfile` should be

{% highlight docker linenos %}
# Inherits the builder image with all dependencies
FROM coolname/yourpackage:builder

# Finally install the package
RUN R CMD INSTALL .
{% endhighlight %}

We are almost there! We just need to add some more commands in `.travis.yml` to build this final
image in case of success.

{% highlight yaml linenos %}
services:
 - docker

install:
 - docker image build -t coolname/yourpackage:builder -f Dockerfile.build .

script:
 - docker container run --rm coolname/yourpackage:builder bash -c "R CMD build . && R CMD check --no-manual --no-build-vignettes --no-examples *tar.gz"

after_success:
 - docker image build -t coolname/mypackage -f Dockerfile ;
 - docker login -u $MYUSER -p $MYPASS ;
 - docker push coolname/mypackage;
{% endhighlight %}

The dependencies are installed only once, straight into the Docker image. The build time should be 
half of the original one! :)
