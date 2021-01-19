FROM golang:1.12-stretch
LABEL maintainer="spreichelt@ucdavis.edu"

RUN apt-get update && apt-get install -y \
    build-essential \
    checkinstall \
    libreadline-gplv2-dev \ 
    libncursesw5-dev \
    libssl-dev \
    libsqlite3-dev \
    tk-dev \
    libgdbm-dev \
    libc6-dev \
    libffi-dev \
    libbz2-dev && \
    apt-get update


RUN wget https://www.python.org/ftp/python/3.7.3/Python-3.7.3.tgz && \
    tar xzf Python-3.7.3.tgz

RUN cd Python-3.7.3 && \
    ./configure --enable-optimizations && \
    make altinstall

RUN python3.7 -m pip install pip --upgrade && \
        python3.7 -m pip install pandas && \
        python3.7 -m pip install tabula-py && \
        python3.7 -m pip install numpy && \
        python3.7 -m pip install requests && \
        python3.7 -m pip install pytest && \
        python3.7 -m pip install jupyter && \
        python3.7 -m pip install jupyterlab && \
        python3.7 -m pip install beautifulsoup4

RUN python3.7 -m pip install tqdm
RUN python3.7 -m pip install xmltodict
RUN python3.7 -m pip install sklearn
RUN python3.7 -m pip install nltk
RUN python3.7 -m pip install gensim

COPY . /app/
WORKDIR /app/

ENV GOPATH /app/go
RUN go get github.com/lib/pq
RUN go build pubmedQueries

ENV PYTHONPATH "${PYTHONPATH}:/app/python"
EXPOSE 8088
CMD ["go", "run", "pubmedQueries"]
