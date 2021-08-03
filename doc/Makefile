
main.pdf: main.tex algo.tex # references.bib
	make clean
	pdflatex main.tex
	#bibtex main
	pdflatex main.tex

gs:
	gs -o main-gs.pdf -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress -sColorConversionStrategy=Gray -sColorConversionStrategyForImages=Gray -sProcessColorModel=DeviceGray -dCompatibilityLevel=1.4 main.pdf

all:
	make main.pdf
	make gs

clean:
	rm -f *.aux *.bbl *.blg *.log *.toc *.out *~ *.synctex.gz main-gs.pdf main.pdf
