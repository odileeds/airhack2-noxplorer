#!/usr/bin/perl

use Data::Dumper;

open(FILE,"Bradford_postcode_centroids.csv");
@lines = <FILE>;
close(FILE);

%pcds;

foreach $line (@lines){

	chomp($line);
	if($line =~ /^([^\s]+) /){
		$pca = $1;
		if(!$pcds{$pca}){ @{$pcds{$pca}} = (); }
		push(@{$pcds{$pca}},$line);
	}
}

foreach $pca (keys(%pcds)){
	$n = @{$pcds{$pca}};
	open(FILE,">","$pca.csv");
	print FILE "Postcode,Lat,Lon\n";
	for($i = 0 ; $i < $n; $i++){
		print FILE "$pcds{$pca}[$i]\n";
	}
	close(FILE);
}