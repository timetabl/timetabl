-- MySQL dump 10.13  Distrib 5.5.41, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: timetabl
-- ------------------------------------------------------
-- Server version	5.5.41-0ubuntu0.14.04.1-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `calcs`
--

DROP TABLE IF EXISTS `calcs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calcs` (
  `id` int(10) unsigned NOT NULL,
  `data` blob NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 MAX_ROWS=1000000;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course`
--

DROP TABLE IF EXISTS `course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `univ` tinyint(3) unsigned NOT NULL,
  `title` varchar(255) CHARACTER SET utf8 NOT NULL DEFAULT '미정',
  `lecturer` varchar(255) CHARACTER SET utf8 NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `course` (`univ`,`title`,`lecturer`)
) ENGINE=InnoDB AUTO_INCREMENT=191761 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kv`
--

DROP TABLE IF EXISTS `kv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kv` (
  `k` varchar(20) NOT NULL,
  `v` text NOT NULL,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lectures`
--

DROP TABLE IF EXISTS `lectures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lectures` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `litid` varchar(13) NOT NULL,
  `domain` text NOT NULL,
  `year` tinyint(3) unsigned NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '미정',
  `credits` decimal(3,1) NOT NULL DEFAULT '0.0',
  `lecturer` varchar(255) NOT NULL,
  `remark` varchar(255) NOT NULL,
  `course_id` int(10) unsigned NOT NULL,
  `time_txt` varchar(255) DEFAULT NULL,
  `location_txt` varchar(255) DEFAULT NULL,
  `competitors` smallint(5) unsigned NOT NULL,
  `univ` tinyint(3) unsigned NOT NULL,
  `semester` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `litid` (`univ`,`semester`,`litid`),
  KEY `course_id` (`course_id`),
  KEY `title` (`univ`,`semester`,`title`(3)),
  KEY `univ_title_lecturer` (`univ`,`title`,`lecturer`)
) ENGINE=InnoDB AUTO_INCREMENT=193668 DEFAULT CHARSET=utf8 MAX_ROWS=1000000;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lessons` (
  `id` int(10) unsigned NOT NULL DEFAULT '0',
  `day` tinyint(3) unsigned NOT NULL,
  `time` smallint(5) unsigned NOT NULL DEFAULT '0',
  `period` smallint(5) unsigned NOT NULL DEFAULT '0',
  `location` varchar(255) NOT NULL,
  `sector` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `day1` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `day2` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `day3` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `day4` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `day5` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `day6` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `day7` mediumint(8) unsigned NOT NULL DEFAULT '0',
  KEY `id` (`id`),
  KEY `day` (`day`),
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 MAX_ROWS=2000000;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `my_events`
--

DROP TABLE IF EXISTS `my_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `my_events` (
  `student_id` int(10) unsigned NOT NULL DEFAULT '0',
  `scenario_id` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `day` tinyint(3) unsigned NOT NULL,
  `time` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `message` varchar(255) NOT NULL,
  PRIMARY KEY (`student_id`,`scenario_id`,`day`,`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 MAX_ROWS=1000000;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `my_lectures`
--

DROP TABLE IF EXISTS `my_lectures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `my_lectures` (
  `student_id` int(10) unsigned NOT NULL DEFAULT '0',
  `scenario_id` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `lecture_id` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`student_id`,`scenario_id`,`lecture_id`),
  KEY `lecture_id` (`lecture_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 MAX_ROWS=10000000;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nicknames`
--

DROP TABLE IF EXISTS `nicknames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nicknames` (
  `title` varchar(255) NOT NULL,
  `nickname` varchar(40) NOT NULL,
  UNIQUE KEY `title` (`title`),
  KEY `nickname` (`nickname`(2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8 MAX_ROWS=100000 PACK_KEYS=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notice_messages`
--

DROP TABLE IF EXISTS `notice_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notice_messages` (
  `rid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `name` varchar(48) NOT NULL DEFAULT '',
  `student_id` int(10) unsigned DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ip` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`rid`),
  KEY `list` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1796055 DEFAULT CHARSET=utf8 MAX_ROWS=5000000;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notices` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `x` smallint(5) unsigned NOT NULL DEFAULT '0',
  `y` smallint(5) unsigned NOT NULL DEFAULT '0',
  `color` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `updated_on` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `updated_on` (`updated_on`)
) ENGINE=InnoDB AUTO_INCREMENT=236037 DEFAULT CHARSET=utf8 MAX_ROWS=500000;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rating_comments`
--

DROP TABLE IF EXISTS `rating_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rating_comments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lecture_id` int(10) unsigned NOT NULL DEFAULT '0',
  `student_id` int(10) unsigned NOT NULL DEFAULT '0',
  `comment` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `opts` set('hidden') NOT NULL,
  `anon_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `lecture_id` (`lecture_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=346746 DEFAULT CHARSET=utf8 MAX_ROWS=1000000;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userid` char(16) NOT NULL,
  `passwd` char(40) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `last_access` date NOT NULL DEFAULT '0000-00-00',
  `email` varchar(255) NOT NULL,
  `nickname` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `lecturer` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `location` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `hideempty` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `created` date NOT NULL,
  `univ` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userid` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=333549 DEFAULT CHARSET=utf8 MAX_ROWS=300000 PACK_KEYS=0;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2015-05-01  3:38:13
